import mongoose from 'mongoose';

const designProjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      default: 'Untitled Project',
    },
    designType: {
      type: String,
      enum: ['UPLOAD', 'TEMPLATE'],
      required: true,
    },
    // For Experience A: Upload Your Own Design
    uploadedArtworkUrl: {
      type: String,
    },
    // For Experience B: Predefined Template Customization
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
    },
    templateCustomizations: {
      type: Map,
      of: String, // key-value pairs mapping field key to customized string/image URL
    },
    configuration: {
      type: Map,
      of: mongoose.Schema.Types.Mixed, // attribute key -> selected option value
    },
    selectedQuantity: {
      type: Number,
      default: 100,
    },
    estimatedPrice: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'READY_FOR_ORDER', 'ORDERED'],
      default: 'DRAFT',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('DesignProject', designProjectSchema);
