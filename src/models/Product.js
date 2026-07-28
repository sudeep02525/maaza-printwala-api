import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    shortDescription: {
      type: String,
    },
    description: {
      type: String,
    },
    images: [{ type: String }],
    basePrice: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isDemoData: {
      type: Boolean,
      default: true,
    },
    artworkRequirements: {
      allowedFormats: [{ type: String, default: ['PDF', 'PNG', 'JPG', 'AI', 'PSD'] }],
      minDpi: { type: Number, default: 300 },
      requiresManualReview: { type: Boolean, default: true },
      safeZoneMm: { type: Number, default: 3 },
      bleedMm: { type: Number, default: 3 },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Product', productSchema);
