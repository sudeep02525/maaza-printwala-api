import CheckoutDraft from '../models/CheckoutDraft.js';
import PaymentAttempt from '../models/PaymentAttempt.js';
import { finalizeOrder, reconcilePendingOrders } from '../services/orderFinalisation.service.js';
import { resolveSession } from './cart.controller.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';

/**
 * Initiate Payment Attempt
 * Derives amountMinor exclusively on backend from authoritative checkout amount.
 * Enforces isProductionPaymentReady hard safety block for live gateway attempts.
 */
export const initiatePayment = async (req, res, next) => {
  try {
    const { sessionId } = resolveSession(req, res);
    const { draftId, idempotencyKey, paymentProvider = 'TEST_DEMO' } = req.body;

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

    // HARD BUSINESS SAFETY BLOCK
    // Reject live gateway initiation if production readiness is false or tax is unconfigured
    if (paymentProvider !== 'TEST_DEMO') {
      if (!draft.isProductionPaymentReady) {
        return sendError(
          res,
          STATUS_CODES.BAD_REQUEST,
          'Production payment gateway processing is blocked. isProductionPaymentReady must be true before live payment initiation.'
        );
      }
      if (draft.taxCalculationStatus === 'NOT_CONFIGURED') {
        return sendError(
          res,
          STATUS_CODES.BAD_REQUEST,
          'Production payment processing is blocked because GST tax policy is NOT_CONFIGURED.'
        );
      }
    }

    // Idempotency check: if key already exists, return existing attempt cleanly
    const existingAttempt = await PaymentAttempt.findOne({ idempotencyKey });
    if (existingAttempt) {
      return sendSuccess(res, STATUS_CODES.OK, 'Retrieved existing payment attempt idempotently.', {
        attempt: existingAttempt,
      });
    }

    // Derive gateway amountMinor exclusively on backend (never trust browser)
    const amountRupees = draft.finalTotalAmount;
    const amountMinor = Math.round(amountRupees * 100);

    const attempt = await PaymentAttempt.create({
      idempotencyKey,
      checkoutDraftId: draft._id,
      user: draft.user || null,
      guestSessionId: draft.sessionId || draft.guestSessionId || null,
      paymentProvider,
      providerOrderId: `${paymentProvider.toLowerCase()}_order_${Date.now()}`,
      amountRupees,
      amountMinor,
      currency: draft.currency || 'INR',
      status: 'PENDING_AUTHENTICATION',
    });

    return sendSuccess(res, STATUS_CODES.CREATED, 'Payment attempt initiated successfully.', { attempt });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm Payment (Architecture Demonstration / Test Mode)
 * Executes transactional order finalisation without calling real Razorpay API or executing real payment.
 */
export const confirmPaymentDemo = async (req, res, next) => {
  try {
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
