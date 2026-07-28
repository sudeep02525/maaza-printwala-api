import Counter from '../models/Counter.js';

/**
 * Collision-safe backend order number generator.
 * Generates human-readable sequence format: MZP-YYYY-XXXXXXXX
 * Uses atomic sequence incrementing via MongoDB Counter collection.
 */
export const generateOrderNumber = async (session = null) => {
  const year = new Date().getFullYear();
  const counterId = `ORDER_${year}`;

  const options = { new: true, upsert: true };
  if (session) {
    options.session = session;
  }

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    options
  );

  const sequenceString = String(counter.seq).padStart(8, '0');
  return `MZP-${year}-${sequenceString}`;
};
