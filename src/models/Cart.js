import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
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
      min: 1,
      default: 100,
    },
    designType: {
      type: String,
      enum: ['UPLOAD', 'TEMPLATE'],
      required: true,
    },
    artwork: {
      fileId: { type: String },
      fileUrl: { type: String }, // Populated programmatically by server storage verification
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
    currency: {
      type: String,
      default: 'INR',
    },
    // Retained for backward compatibility if older schemas referenced it
    designProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DesignProject',
    },
  },
  {
    timestamps: true,
  }
);

const cartSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      index: true, // Assigned via backend httpOnly cookie for guest sessions
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true, // Optional for guests; populated when authenticated
    },
    items: [cartItemSchema],
    cartTotal: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure index for fast retrieval by either user or sessionId
cartSchema.index({ user: 1, sessionId: 1 });

export default mongoose.model('Cart', cartSchema);
