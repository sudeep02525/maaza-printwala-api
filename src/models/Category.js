import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String },
    isNew: { type: Boolean, default: false },
  },
  { suppressReservedKeysWarning: true }
);

const subcategoryGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Paper Types", "Finishes"
    items: [itemSchema]
  },
  { suppressReservedKeysWarning: true }
);

const categorySchema = new mongoose.Schema(
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
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    subcategoryGroups: [subcategoryGroupSchema],
    metaTitle: {
      type: String,
    },
    metaDescription: {
      type: String,
    },
    seoContent: {
      type: String,
    },
    faqs: [{
      question: { type: String, required: true },
      answer: { type: String, required: true }
    }]
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
  }
);

export default mongoose.model('Category', categorySchema);
