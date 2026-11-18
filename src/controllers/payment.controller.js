import crypto from 'crypto';
import CheckoutDraft from '../models/CheckoutDraft.js';
import PaymentAttempt from '../models/PaymentAttempt.js';
import { finalizeOrder, reconcilePendingOrders } from '../services/orderFinalisation.service.js';
import { resolveSession } from './cart.controller.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';
import { getRazorpay, isRazorpayConfigured } from '../config/razorpay.js';

/**
 * Initiate Payment Attempt
 * Supports RAZORPAY and TEST_DEMO.
 * Derives amountMinor exclusively on backend from authoritative checkout amount.
 */
export const initiatePayment = async (req, res, next) => {
  try {
    const { sessionId } = resolveSession(req, res);
    const { draftId, idempotencyKey, paymentProvider = isRazorpayConfigured() ? 'RAZORPAY' : 'TEST_DEMO' } = req.body;

    if (!draftId || !idempotencyKey) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'draftId and idempotencyKey are required.');
    }

    const draft = await CheckoutDraft.findById(draftId);
    if (!draft) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Checkout draft not found.');
    }

    // Verify ownership
    const isOwnerUser = req.user && draft.user && draft.user.toString() === req.user._id.toString();
    const isOwnerGuest = !draft.user && (draft.sessionId === sessionId || draft.guestSessionId === sessionId);
    if (!isOwnerUser && !isOwnerGuest) {
      return sendError(res, STATUS_CODES.FORBIDDEN, 'Unauthorized access to this checkout draft.');
    }

    if (draft.status !== 'READY_FOR_PAYMENT') {
      return sendError(res, STATUS_CODES.BAD_REQUEST, `Checkout draft is not in READY_FOR_PAYMENT state (current: ${draft.status}).`);
    }

    // Check existing attempt for idempotency
    const existingAttempt = await PaymentAttempt.findOne({ idempotencyKey });
    if (existingAttempt) {
      return sendSuccess(res, STATUS_CODES.OK, 'Retrieved existing payment attempt idempotently.', {
        attempt: existingAttempt,
      });
    }

    // Derive gateway amountMinor exclusively on backend (never trust browser)
    const amountRupees = draft.finalTotalAmount;
    const amountMinor = Math.round(amountRupees * 100);

    let providerOrderId = `${paymentProvider.toLowerCase()}_order_${Date.now()}`;
    let razorpayOrderData = null;

    if (paymentProvider === 'RAZORPAY') {
      if (!isRazorpayConfigured()) {
        return sendError(res, STATUS_CODES.BAD_REQUEST, 'Razorpay gateway credentials are not configured on the server.');
      }
      const razorpay = getRazorpay();
      const rzpOrder = await razorpay.orders.create({
        amount: amountMinor,
        currency: draft.currency || 'INR',
        receipt: `rcpt_${draft._id.toString().slice(-12)}`,
        notes: {
          draftId: draft._id.toString(),
          orderNumber: draft.orderNumber || '',
        },
      });
      providerOrderId = rzpOrder.id;
      razorpayOrderData = rzpOrder;
    }

    const attempt = await PaymentAttempt.create({
      idempotencyKey,
      checkoutDraftId: draft._id,
      user: draft.user || null,
      guestSessionId: draft.sessionId || draft.guestSessionId || null,
      paymentProvider,
      providerOrderId,
      amountRupees,
      amountMinor,
      currency: draft.currency || 'INR',
      status: 'PENDING_AUTHENTICATION',
    });

    return sendSuccess(res, STATUS_CODES.CREATED, 'Payment attempt initiated successfully.', {
      attempt,
      razorpayOrder: razorpayOrderData,
      keyId: process.env.RAZORPAY_KEY_ID || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Razorpay Signature and Finalize Order
 */
export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { attemptId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!attemptId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'attemptId, razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.');
    }

    const attempt = await PaymentAttempt.findById(attemptId);
    if (!attempt) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Payment attempt not found.');
    }

    // Verify HMAC SHA256 Signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return sendError(res, STATUS_CODES.INTERNAL_SERVER_ERROR, 'Razorpay key secret not configured.');
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (expectedSignature !== razorpay_signature) {
      attempt.status = 'FAILED';
      await attempt.save();
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Razorpay payment signature verification failed.');
    }

    // Finalize order
    const result = await finalizeOrder(attempt._id, {
      verificationMethod: 'RAZORPAY_SIGNATURE',
      sanitizedMetadata: {
        providerOrderId: razorpay_order_id,
        providerPaymentId: razorpay_payment_id,
        status: 'SUCCESS',
      },
    });

    return sendSuccess(res, STATUS_CODES.OK, 'Razorpay payment verified and order finalized.', {
      order: result.order,
      opaqueToken: result.opaqueToken,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Razorpay Webhook Handler
 */
export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Strict Fail-Closed Security: Must reject immediately if secret or signature is absent
    if (!webhookSecret) {
      console.error('[Razorpay Webhook] Server missing RAZORPAY_WEBHOOK_SECRET.');
      return res.status(500).json({ status: 'error', message: 'Webhook secret not configured on server' });
    }

    if (!signature) {
      console.warn('[Razorpay Webhook Rejected] Missing x-razorpay-signature header.');
      return res.status(400).json({ status: 'error', message: 'Missing x-razorpay-signature header' });
    }

    // Exact raw buffer verification
    const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    if (expected !== signature) {
      console.warn('[Razorpay Webhook Rejected] Webhook signature mismatch.');
      return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (event?.event === 'payment.captured' || event?.event === 'order.paid') {
      const providerOrderId = event?.payload?.payment?.entity?.order_id;
      if (providerOrderId) {
        const attempt = await PaymentAttempt.findOne({ providerOrderId });
        if (attempt && attempt.status !== 'SUCCESS') {
          await finalizeOrder(attempt._id, {
            verificationMethod: 'RAZORPAY_WEBHOOK',
            eventId: event.id,
            eventType: event.event,
            sanitizedMetadata: {
              providerOrderId,
              providerPaymentId: event.payload.payment.entity.id,
              status: 'SUCCESS',
            },
          });
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('[Razorpay Webhook Error]:', err.message);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/**
 * Confirm Payment (Architecture Demonstration / Test Mode)
 */
export const confirmPaymentDemo = async (req, res, next) => {
  try {
    if (process.env.ENABLE_TEST_PAYMENTS !== 'true') {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Demo payments are disabled in this environment.');
    }

    const { sessionId } = resolveSession(req, res);
    const { attemptId, verificationMethod = 'TEST_DEMO' } = req.body;

    if (!attemptId) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'attemptId is required.');
    }

    const attempt = await PaymentAttempt.findById(attemptId);
    if (!attempt) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Payment attempt not found.');
    }

    // Verify ownership
    const isOwnerUser = req.user && attempt.user && attempt.user.toString() === req.user._id.toString();
    const isOwnerGuest = !attempt.user && attempt.guestSessionId && attempt.guestSessionId === sessionId;
    if (!isOwnerUser && !isOwnerGuest) {
      return sendError(res, STATUS_CODES.FORBIDDEN, 'Unauthorized access to this payment attempt.');
    }

    const result = await finalizeOrder(attempt._id, {
      verificationMethod,
      sanitizedMetadata: {
        providerOrderId: attempt.providerOrderId,
        providerPaymentId: `demo_pay_${Date.now()}`,
        status: 'SUCCESS',
      },
    });

    return sendSuccess(res, STATUS_CODES.OK, 'Payment verified and order finalized transactionally.', {
      order: result.order,
      opaqueToken: result.opaqueToken,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (error) {
    if (error.status) {
      return sendError(res, error.status, error.message);
    }
    next(error);
  }
};

/**
 * Reconcile SUCCESS_PENDING_ORDER attempts
 */
export const reconcilePending = async (req, res, next) => {
  try {
    const results = await reconcilePendingOrders();
    return sendSuccess(res, STATUS_CODES.OK, 'Reconciliation process completed.', { results });
  } catch (error) {
    next(error);
  }
};
