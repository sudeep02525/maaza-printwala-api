import mongoose from 'mongoose';
import { PAYMENT_STATUS, FULFILMENT_STATUS, ARTWORK_STATUS, ORDER_STATUS } from '../constants/order.constants.js';

const orderStatusHistorySchema = new mongoose.Schema({
  previousStatus: { type: String },
  newStatus: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  actorType: { type: String, enum: ['SYSTEM', 'CUSTOMER', 'ADMIN'], required: true },
  actorId: { type: String }, // User ID, Admin ID, or 'SYSTEM_WEBHOOK'
  note: { type: String, trim: true },
});

const orderItemSnapshotSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productNameSnapshot: { type: String, required: true },
  productImageSnapshot: { type: String, default: '' },
  configurationSnapshot: { type: Map, of: mongoose.Schema.Types.Mixed },
  dimensions: {
    width: { type: Number },
    height: { type: Number },
    unit: { type: String, default: 'ft' },
  },
  quantity: { type: Number, required: true },
  authoritativeUnitPrice: { type: Number, required: true },
  authoritativeLineTotal: { type: Number, required: true },
  designType: { type: String, enum: ['UPLOAD', 'TEMPLATE'], required: true },
  artwork: {
    fileId: { type: String },
    fileUrl: { type: String },
    originalName: { type: String },
  },
  template: {
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
    templateName: { type: String },
    previewUrl: { type: String },
    customFields: { type: Map, of: String },
  },
  artworkStatus: {
    type: String,
    enum: Object.values(ARTWORK_STATUS),
    default: ARTWORK_STATUS.PENDING_REVIEW,
  },
  artworkRevisions: [
    {
      fileId: String,
      originalName: String,
      fileUrl: String,
      status: String,
      note: String,
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },

    // Ownership (Supports both authenticated users and guest sessions)
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    guestSessionId: { type: String, default: null, index: true },

    // Secure Guest Tracking Token Architecture
    guestAccessKeyHash: { type: String, default: null, select: false }, // Cryptographic SHA-256 hash of opaque token
    guestTokenExpiresAt: { type: Date, default: null }, // Support token expiration
    guestTokenRevoked: { type: Boolean, default: false }, // Support token revocation/rotation

    // Reference to source checkout and payment attempt
    checkoutDraftId: { type: mongoose.Schema.Types.ObjectId, ref: 'CheckoutDraft', required: true, unique: true },
    paymentAttemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentAttempt', required: true, unique: true },

    // Immutable Item Snapshots
    items: [orderItemSnapshotSchema],

    // Customer & Fulfillment Snapshots
    contactDetails: {
      fullName: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      phone: { type: String, required: true },
    },
    deliveryAddress: {
      fullName: String,
      phone: String,
      streetAddress: String,
      city: String,
      state: String,
      pinCode: String,
    },
    billingDetails: {
      sameAsDelivery: { type: Boolean, default: true },
      address: {
        fullName: String,
        phone: String,
        streetAddress: String,
        city: String,
        state: String,
        pinCode: String,
      },
      isBusinessPurchase: { type: Boolean, default: false },
      companyName: String,
      gstin: String,
      purchaseOrderNumber: String,
    },
    deliveryMethodSnapshot: {
      name: String,
      deliveryMethod: { type: String, enum: ['STANDARD', 'EXPRESS', 'SAME_DAY'] },
      charge: { type: Number, required: true },
      estimatedDaysMin: Number,
      estimatedDaysMax: Number,
      isDemoData: { type: Boolean, default: true },
    },

    // Financial Snapshots (Explicit Rupee Representation)
    authoritativeSubtotal: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true },
    taxCalculationStatus: {
      type: String,
      enum: ['NOT_CONFIGURED', 'CONFIGURED', 'EXEMPT'],
      default: 'NOT_CONFIGURED',
    },
    taxAmount: { type: Number, default: null },
    finalPayableAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    // State Machines
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.NOT_STARTED,
      index: true,
    },
    fulfilmentStatus: {
      type: String,
      enum: Object.values(FULFILMENT_STATUS),
      default: FULFILMENT_STATUS.ORDER_RECEIVED,
      index: true,
    },
    // Backward compatibility field for legacy admin code
    orderStatus: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.ORDER_RECEIVED,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['GATEWAY', 'COD', 'TEST_DEMO'],
      default: 'GATEWAY',
    },

    // Audit Trail
    statusHistory: [orderStatusHistorySchema],
    adminNotes: [
      {
        note: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Middleware to sync orderStatus and fulfilmentStatus
orderSchema.pre('save', async function () {
  if (this.isModified('fulfilmentStatus') && !this.isModified('orderStatus')) {
    this.orderStatus = this.fulfilmentStatus;
  } else if (this.isModified('orderStatus') && !this.isModified('fulfilmentStatus')) {
    this.fulfilmentStatus = this.orderStatus;
  }
});

export default mongoose.model('Order', orderSchema);
