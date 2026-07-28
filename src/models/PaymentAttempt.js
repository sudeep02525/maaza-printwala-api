import mongoose from 'mongoose';

const paymentAttemptSchema = new mongoose.Schema(
  {
    // Idempotency & Ownership
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    checkoutDraftId: { type: mongoose.Schema.Types.ObjectId, ref: 'CheckoutDraft', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    guestSessionId: { type: String, default: null },

    // Gateway Provider Details
    paymentProvider: {
      type: String,
      enum: ['RAZORPAY', 'COD', 'TEST_DEMO'],
      required: true,
      default: 'RAZORPAY',
    },
    providerOrderId: { type: String, index: true }, // e.g., Razorpay order_xxxxxx
    providerPaymentId: { type: String, index: true }, // e.g., Razorpay pay_xxxxxx

    // Sanitized Signature Verification Storage (No raw secret retention)
    signatureVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    verificationMethod: {
      type: String,
      enum: ['WEBHOOK_HMAC', 'CLIENT_CALLBACK_HMAC', 'MANUAL_ADMIN', 'COD', 'TEST_DEMO'],
      default: null,
    },

    // Explicit Financial Representation (Removes ambiguity)
    amountRupees: { type: Number, required: true }, // Established commerce representation (e.g. 77199)
    amountMinor: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer minor unit value.',
      },
    }, // Explicit integer minor-unit for gateway (e.g. 7719900 paise for INR)
    currency: { type: String, default: 'INR' },

    // Lifecycle & Recovery State Machine
    status: {
      type: String,
      enum: [
        'INITIATED',
        'PENDING_AUTHENTICATION',
        'SUCCESS_PENDING_ORDER', // Provider confirmed payment, but local DB order creation is pending/retrying
        'SUCCESS', // Finalized: Order successfully created and linked
        'FAILED',
        'EXPIRED',
        'REFUNDED',
      ],
      default: 'INITIATED',
      index: true,
    },
    failureReason: { type: String, default: null },
    errorCode: { type: String, default: null },

    // Timestamps
    initiatedAt: { type: Date, default: Date.now },
    paidAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },

    // Webhook & Refund Logs (Strictly Sanitized)
    webhookEventsReceived: [
      {
        eventId: String,
        eventType: String,
        receivedAt: { type: Date, default: Date.now },
        sanitizedMetadata: {
          providerOrderId: String,
          providerPaymentId: String,
          status: String,
          errorCode: String,
        },
      },
    ],
    refunds: [
      {
        providerRefundId: String,
        amountMinor: { type: Number, validate: { validator: Number.isInteger } },
        reason: String,
        status: String,
        initiatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('PaymentAttempt', paymentAttemptSchema);
