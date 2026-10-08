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
    categoryName: {
      type: String,
      trim: true,
    },
    shortDescription: {
      type: String,
    },
    description: {
      type: String,
    },
    brand: {
      type: String,
      trim: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    keywords: [{ type: String, trim: true, lowercase: true }],
    images: [{ type: String }],
    basePrice: {
      type: Number,
      default: 0,
    },
    mrp: {
      type: Number,
      default: null,
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
    searchCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add text indexes for efficient MongoDB native text search (as a backup/complement)
productSchema.index({
  name: 'text',
  keywords: 'text',
  shortDescription: 'text',
  categoryName: 'text'
}, {
  weights: {
    name: 10,
    keywords: 8,
    categoryName: 5,
    shortDescription: 2
  },
  name: "ProductSearchIndex"
});

export default mongoose.model('Product', productSchema);
