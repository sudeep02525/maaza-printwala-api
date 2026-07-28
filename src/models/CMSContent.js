import mongoose from 'mongoose';

const cmsContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    section: {
      type: String,
      required: true,
      enum: ['HERO', 'BANNERS', 'FAQ', 'POLICY', 'ABOUT', 'CONTACT_INFO'],
    },
    title: {
      type: String,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
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

export default mongoose.model('CMSContent', cmsContentSchema);
