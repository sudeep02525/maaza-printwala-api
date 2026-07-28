import crypto from 'crypto';
import mongoose from 'mongoose';
import PaymentAttempt from '../models/PaymentAttempt.js';
import CheckoutDraft from '../models/CheckoutDraft.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import { generateOrderNumber } from './orderNumber.service.js';
import { PAYMENT_STATUS, FULFILMENT_STATUS } from '../constants/order.constants.js';

/**
 * Detects if the MongoDB deployment supports multi-document ACID transactions
 * (requires replica set or sharded cluster; standalone instances do not support transactions).
 */
let _txSupported = null;
async function supportsTransactions() {
  if (_txSupported !== null) return _txSupported;
  try {
    const admin = mongoose.connection.db.admin();
    const status = await admin.command({ isMaster: 1 });
    _txSupported = !!(status.setName || status.msg === 'isdbgrid');
  } catch {
    _txSupported = false;
  }
  return _txSupported;
}

/**
 * Transactional Order Finalisation Service
 * Implements MongoDB ACID transaction (where supported) with idempotency and SUCCESS_PENDING_ORDER recovery.
 * Gracefully degrades to sequential unique-constraint-protected operations on standalone instances.
 */
export const finalizeOrder = async (attemptId, verificationMetadata = {}) => {
  let session = null;
  let useTransaction = false;

  const txSupport = await supportsTransactions();
  if (txSupport) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } catch (txErr) {
      if (session) { session.endSession(); session = null; }
      useTransaction = false;
    }
  }

  const opt = (options = {}) => (useTransaction && session ? { ...options, session } : options);


  try {
    // 1. Atomically check and claim PaymentAttempt
    let attempt = await PaymentAttempt.findOne({ _id: attemptId }, null, opt());
    if (!attempt) {
      throw { status: 404, message: 'Payment attempt not found.' };
    }

    // Idempotency check: if already finalized, return existing order cleanly
    if (attempt.status === 'SUCCESS' && attempt.orderId) {
      const existingOrder = await Order.findById(attempt.orderId, null, opt());
      if (useTransaction) {
        await session.commitTransaction();
        session.endSession();
      }
      return { success: true, alreadyProcessed: true, order: existingOrder, opaqueToken: null };
    }

    // Check if an Order already exists for this attempt or draft (defense in depth)
    const existingOrderByRef = await Order.findOne(
      { $or: [{ paymentAttemptId: attempt._id }, { checkoutDraftId: attempt.checkoutDraftId }] },
      null,
      opt()
    );
    if (existingOrderByRef) {
      attempt.status = 'SUCCESS';
      attempt.orderId = existingOrderByRef._id;
      if (!attempt.signatureVerified) {
        attempt.signatureVerified = true;
        attempt.verifiedAt = new Date();
        attempt.verificationMethod = verificationMetadata.verificationMethod || 'RECONCILIATION';
      }
      await attempt.save(opt());
      if (useTransaction) {
        await session.commitTransaction();
        session.endSession();
      }
      return { success: true, alreadyProcessed: true, order: existingOrderByRef, opaqueToken: null };
    }

    // Mark as SUCCESS_PENDING_ORDER during claim step
    attempt.status = 'SUCCESS_PENDING_ORDER';
    attempt.signatureVerified = true;
    attempt.verifiedAt = attempt.verifiedAt || new Date();
    attempt.verificationMethod = verificationMetadata.verificationMethod || attempt.verificationMethod || 'TEST_DEMO';
    if (verificationMetadata.sanitizedMetadata) {
      attempt.webhookEventsReceived.push({
        eventId: verificationMetadata.eventId || `EVT_${Date.now()}`,
        eventType: verificationMetadata.eventType || 'payment.confirmed',
        receivedAt: new Date(),
        sanitizedMetadata: verificationMetadata.sanitizedMetadata,
      });
    }
    await attempt.save(opt());

    // 2. Fetch CheckoutDraft
    const draft = await CheckoutDraft.findById(attempt.checkoutDraftId, null, opt());
    if (!draft) {
      throw { status: 404, message: 'Source checkout draft not found.' };
    }

    // 3. Generate collision-safe order number
    const orderNumber = await generateOrderNumber(useTransaction ? session : null);

    // 4. Generate high-entropy opaque token for guest tracking if unauthenticated
    let opaqueToken = null;
    let guestAccessKeyHash = null;
    let guestTokenExpiresAt = null;

    if (!attempt.user && (attempt.guestSessionId || draft.sessionId || draft.guestSessionId)) {
      opaqueToken = `g_trk_${crypto.randomBytes(32).toString('hex')}`;
      guestAccessKeyHash = crypto.createHash('sha256').update(opaqueToken).digest('hex');
      guestTokenExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days validity
    }

    // 5. Create immutable Order document
    const orderPayload = {
      orderNumber,
      user: attempt.user || draft.user || null,
      guestSessionId: attempt.guestSessionId || draft.sessionId || draft.guestSessionId || null,
      guestAccessKeyHash,
      guestTokenExpiresAt,
      guestTokenRevoked: false,
      checkoutDraftId: draft._id,
      paymentAttemptId: attempt._id,
      items: draft.itemsSnapshot,
      contactDetails: draft.contactDetails,
      deliveryAddress: draft.deliveryAddress,
      billingDetails: draft.billingDetails,
      deliveryMethodSnapshot: draft.deliveryMethodSnapshot,
      authoritativeSubtotal: draft.authoritativeSubtotal,
      deliveryCharge: draft.deliveryCharge,
      taxCalculationStatus: draft.taxCalculationStatus,
      taxAmount: draft.taxAmount,
      finalPayableAmount: draft.finalTotalAmount,
      currency: draft.currency || 'INR',
      paymentStatus: PAYMENT_STATUS.PAID,
      fulfilmentStatus: FULFILMENT_STATUS.ORDER_RECEIVED,
      paymentMethod: attempt.paymentProvider,
      statusHistory: [
        {
          previousStatus: null,
          newStatus: FULFILMENT_STATUS.ORDER_RECEIVED,
          timestamp: new Date(),
          actorType: 'SYSTEM',
          actorId: 'SYSTEM_FINALISATION',
          note: `Order finalized atomically via ${attempt.paymentProvider}`,
        },
      ],
    };

    const orderResult = await Order.create([orderPayload], opt());
    const createdOrder = orderResult[0];

    // 6. Link Order to PaymentAttempt and set status = SUCCESS
    attempt.orderId = createdOrder._id;
    attempt.status = 'SUCCESS';
    await attempt.save(opt());

    // 7. Consume CheckoutDraft
    draft.status = 'CONSUMED';
    await draft.save(opt());

    // 8. Clear customer Cart
    const targetCartId = draft.cart || draft.cartId;
    if (targetCartId) {
      await Cart.findOneAndUpdate({ _id: targetCartId }, { $set: { items: [], cartTotal: 0 } }, opt());
    }

    if (useTransaction) {
      await session.commitTransaction();
      session.endSession();
    }

    return {
      success: true,
      alreadyProcessed: false,
      order: createdOrder,
      opaqueToken,
    };
  } catch (error) {
    if (useTransaction && session) {
      await session.abortTransaction();
      session.endSession();
    }

    // Recovery preservation: if order creation failed, ensure PaymentAttempt is preserved in SUCCESS_PENDING_ORDER
    try {
      await PaymentAttempt.findByIdAndUpdate(attemptId, {
        $set: {
          status: 'SUCCESS_PENDING_ORDER',
          failureReason: `Temporary finalisation failure: ${error.message || 'Unknown error'}`,
        },
      });
    } catch (saveErr) {
      console.error('Failed to preserve SUCCESS_PENDING_ORDER state:', saveErr);
    }

    throw error;
  }
};

/**
 * Background Recovery Reconciliation
 * Retries order finalisation for any PaymentAttempt stuck in SUCCESS_PENDING_ORDER.
 */
export const reconcilePendingOrders = async () => {
  const pendingAttempts = await PaymentAttempt.find({ status: 'SUCCESS_PENDING_ORDER' });
  const results = [];

  for (const attempt of pendingAttempts) {
    try {
      const res = await finalizeOrder(attempt._id, {
        verificationMethod: attempt.verificationMethod || 'RECONCILIATION',
      });
      results.push({ attemptId: attempt._id, success: true, orderId: res.order?._id });
    } catch (err) {
      results.push({ attemptId: attempt._id, success: false, error: err.message });
    }
  }

  return results;
};
