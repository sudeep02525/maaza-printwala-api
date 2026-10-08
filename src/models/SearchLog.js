import mongoose from 'mongoose';

const searchLogSchema = new mongoose.Schema({
  term: { type: String, required: true, unique: true, lowercase: true, trim: true },
  displayTerm: { type: String },
  count: { type: Number, default: 0 },
  lastSearchedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('SearchLog', searchLogSchema);
