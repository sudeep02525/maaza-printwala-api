import mongoose from 'mongoose';

const bulkEnquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
    },
    productType: {
      type: String,
      required: true,
    },
    estimatedQuantity: {
      type: Number,
      required: true,
    },
    targetDate: {
      type: Date,
    },
    requirements: {
      type: String,
    },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST'],
      default: 'NEW',
    },
    adminNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('BulkEnquiry', bulkEnquirySchema);
