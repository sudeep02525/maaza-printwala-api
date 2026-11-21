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
      enum: [
        'HERO',
        'BANNERS',
        'FOOTER',
        'FAQ',
        'POLICY',
        'ABOUT',
        'CONTACT_INFO',
        'MENU',
        'BULK_ENQUIRY',
        'SEO',
        'TRUST',
        'ANNOUNCEMENT',
        'CATEGORIES',
        'HEADINGS',
        'PAYMENT',
        'OTHER',
      ],
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
    sortOrder: {
      type: Number,
      default: 0,
    },
    isDemoData: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('CMSContent', cmsContentSchema);
