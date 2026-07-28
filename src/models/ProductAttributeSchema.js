import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  value: { type: String, required: true },
  label: { type: String, required: true },
  priceModifier: { type: Number, default: 0 },
  image: { type: String },
  requiresInput: [{ type: String }], // e.g., ["width", "height"] for custom ranges
});

const attributeSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['select', 'select-with-image', 'numeric-range', 'swatch'],
    required: true,
  },
  required: { type: Boolean, default: true },
  options: [optionSchema],
  minRange: { type: Number },
  maxRange: { type: Number },
  unit: { type: String },
});

const productAttributeSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    attributes: [attributeSchema],
    quantityTiers: [{ type: Number }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('ProductAttributeSchema', productAttributeSchema);
