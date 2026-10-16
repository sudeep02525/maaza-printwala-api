import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'store', unique: true }, // single-doc settings
    storeName: { type: String, default: 'Maza Printwala' },
    tagline: { type: String, default: 'Enterprise Commercial Printing & Merchandising' },
    supportEmail: { type: String, default: 'support@maazaprintwala.in' },
    supportPhone: { type: String, default: '1800-PRINT-NOW' },
    dispatchCity: { type: String, default: 'Mumbai, Maharashtra' },
    gstRate: { type: Number, default: 18 },
    freeShippingThreshold: { type: Number, default: 999 },
    standardShippingFee: { type: Number, default: 99 },
    minOrderValue: { type: Number, default: 199 },
    defaultDpiCheck: { type: Number, default: 300 },
    autoApproveProof: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
