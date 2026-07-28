import mongoose from 'mongoose';

const deliveryRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    pinCodePrefixes: [{ type: String, required: true }],
    deliveryMethod: {
      type: String,
      enum: ['STANDARD', 'EXPRESS', 'SAME_DAY'],
      default: 'STANDARD',
    },
    charge: {
      type: Number,
      default: 0,
    },
    freeDeliveryThreshold: {
      type: Number,
    },
    estimatedDaysMin: {
      type: Number,
      default: 3,
    },
    estimatedDaysMax: {
      type: Number,
      default: 7,
    },
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

export default mongoose.model('DeliveryRule', deliveryRuleSchema);
