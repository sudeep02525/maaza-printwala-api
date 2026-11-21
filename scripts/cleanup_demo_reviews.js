import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const cannedComments = [
  'Phenomenal print crispness! The cardstock has a solid, luxurious hand-feel.',
  'Colors matched our corporate branding pantone precisely. Fast turnaround.',
  'Very clean edges and high quality velvet matte finish. Will reorder!',
  'Exceeded expectations. The online template editor made customization effortless.'
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const Review = (await import('../src/models/Review.js')).default;
  const Product = (await import('../src/models/Product.js')).default;

  const result = await Review.deleteMany({
    $or: [
      { isDemoData: true },
      { comment: { $in: cannedComments } }
    ]
  });

  console.log(`Deleted ${result.deletedCount} demo/canned reviews from DB.`);

  // Recalculate rating and numReviews for all products
  const products = await Product.find({});
  for (const prod of products) {
    const reviews = await Review.find({ product: prod._id, isApproved: true, isDemoData: { $ne: true } });
    if (reviews.length === 0) {
      prod.rating = 0;
      prod.numReviews = 0;
    } else {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      prod.rating = parseFloat((sum / reviews.length).toFixed(1));
      prod.numReviews = reviews.length;
    }
    await prod.save();
  }
  console.log('Recalculated product ratings and review counts successfully.');

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
