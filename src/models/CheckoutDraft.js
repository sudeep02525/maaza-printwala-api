import mongoose from 'mongoose';

const checkoutDraftItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productNameSnapshot: {
      type: String,
      required: true,
    },
    productImageSnapshot: {
      type: String,
    },
    configurationSnapshot: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    dimensions: {
      width: { type: Number },
      height: { type: Number },
      unit: { type: String, default: 'ft' },
    },
    quantity: {
      type: Number,
      required: true,
    },
    designType: {
      type: String,
      enum: ['UPLOAD', 'TEMPLATE'],
      required: true,
    },
    artwork: {
      fileId: { type: String },
      fileUrl: { type: String },
      originalName: { type: String },
    },
    template: {
      templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
      },
      templateName: { type: String },
      previewUrl: { type: String },
      customFields: {
        type: Map,
        of: String,
      },
    },
    authoritativeUnitPrice: {
      type: Number,
      required: true,
    },
    authoritativeLineTotal: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    streetAddress: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pinCode: { type: String, trim: true },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const checkoutDraftSchema = new mongoose.Schema(
  {
    draftNumber: {
      type: String,
      required: true,
      unique: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',
      required: true,
    },
    itemsSnapshot: [checkoutDraftItemSchema],
    authoritativeSubtotal: {
      type: Number,
      required: true,
      default: 0,
    },

    // Step 1: Contact Details
    contactDetails: {
      fullName: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
    },

    // Step 2: Delivery Address (Structured Indian Address - Manual City/State)
    deliveryAddress: addressSnapshotSchema,

    // Step 3: Billing & GST Business Purchase Details
    billingDetails: {
      sameAsDelivery: { type: Boolean, default: true },
      address: addressSnapshotSchema,
      isBusinessPurchase: { type: Boolean, default: false },
      companyName: { type: String, trim: true },
      gstin: { type: String, trim: true, uppercase: true },
      purchaseOrderNumber: { type: String, trim: true },
    },

    // Step 4: Delivery Method (Backend-Driven Demo Rules)
    selectedDeliveryRule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryRule',
    },
    deliveryMethodSnapshot: {
      name: { type: String },
      deliveryMethod: { type: String }, // STANDARD | EXPRESS | SAME_DAY
      charge: { type: Number, default: 0 },
      estimatedDaysMin: { type: Number },
      estimatedDaysMax: { type: Number },
      isDemoData: { type: Boolean, default: true },
    },

    // Authoritative Totals & Explicit Tax Pending State
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    taxCalculationStatus: {
      type: String,
      enum: ['NOT_CONFIGURED', 'CALCULATED', 'CONFIGURED', 'EXEMPT'],
      default: 'NOT_CONFIGURED',
    },
    taxAmount: {
      type: Number,
      default: null, // Nullable! Never faked as 0 when unknown
    },
    finalTotalAmount: {
      type: Number,
      default: 0, // Authoritative Subtotal + Delivery Charge (while tax is pending)
    },
    currency: {
      type: String,
      default: 'INR',
    },

    // Validation Status & Safety Guards
    status: {
      type: String,
      enum: [
        'IN_PROGRESS',
        'READY_FOR_PAYMENT',
        'EXPIRED',
        'ABORTED_PRICE_CHANGE',
        'ABORTED_INVALID_CART',
        'CONSUMED', // Phase 8: finalized after successful payment
      ],
      default: 'IN_PROGRESS',
    },
    isProductionPaymentReady: {
      type: Boolean,
      default: false, // Must remain false in Phase 7B!
    },
    productionBlockReason: {
      type: String,
      default:
        'Pending business configuration: Live online payments will be enabled once merchant onboarding and gateway credential verification are completed.',
    },
    priceChangeWarning: {
      type: String,
      default: null,
    },

    // Configurable Expiry
    expiresAt: {
      type: Date,
      required: true,
      default: () => {
        const hours = parseInt(process.env.CHECKOUT_DRAFT_EXPIRY_HOURS || '24', 10);
        return new Date(Date.now() + hours * 60 * 60 * 1000);
      },
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired drafts if needed by indexing expiresAt
checkoutDraftSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('CheckoutDraft', checkoutDraftSchema);
