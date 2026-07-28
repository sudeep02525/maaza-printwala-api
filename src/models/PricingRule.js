import mongoose from 'mongoose';

const pricingRuleSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
    },
    quantityBreaks: [
      {
        minQty: { type: Number, required: true },
        pricePerUnit: { type: Number, required: true },
      },
    ],
    attributeModifiers: [
      {
        attributeKey: { type: String, required: true },
        optionValue: { type: String, required: true },
        priceModifier: { type: Number, required: true }, // Additive or multiplier
        modifierType: { type: String, enum: ['FLAT', 'PERCENTAGE', 'PER_SQ_FT'], default: 'FLAT' },
      },
    ],
    isDemoData: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('PricingRule', pricingRuleSchema);
