import mongoose from 'mongoose';

const editableFieldSchema = new mongoose.Schema({
  key: { type: String, required: true }, // e.g., "company_name", "logo_image"
  label: { type: String, required: true },
  type: { type: String, enum: ['TEXT', 'IMAGE', 'COLOR'], required: true },
  defaultValue: { type: String },
  maxLength: { type: Number },
});

const templateSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: {
      type: String,
    },
    previewFront: {
      type: String,
    },
    previewBack: {
      type: String,
    },
    editableFields: [editableFieldSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    isDemoData: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Template', templateSchema);
