import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Coupon from './src/models/Coupon.js';
import Review from './src/models/Review.js';
import Product from './src/models/Product.js';
import User from './src/models/User.js';

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // 1. Seed Coupons
  const couponsData = [
    {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 500,
      maxDiscountAmount: 500,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      code: 'PRINTWALA100',
      discountType: 'FLAT',
      discountValue: 100,
      minOrderValue: 800,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      code: 'CORP20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderValue: 2000,
      maxDiscountAmount: 1500,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  ];

  for (const c of couponsData) {
    await Coupon.findOneAndUpdate({ code: c.code }, c, { upsert: true, new: true });
  }
  console.log('Seeded coupons: WELCOME10, PRINTWALA100, CORP20');

  // 2. Seed Sample Reviews
  let demoUser = await User.findOne({ role: 'CUSTOMER' });
  if (!demoUser) {
    demoUser = await User.findOne({});
  }

  if (demoUser) {
    const products = await Product.find({ isActive: true }).limit(6);
    const sampleReviews = [
      { rating: 5, comment: 'Phenomenal print crispness! The cardstock has a solid, luxurious hand-feel.' },
      { rating: 5, comment: 'Colors matched our corporate branding pantone precisely. Fast turnaround.' },
      { rating: 4, comment: 'Very clean edges and high quality velvet matte finish. Will reorder!' },
      { rating: 5, comment: 'Exceeded expectations. The online template editor made customization effortless.' },
    ];

    for (const prod of products) {
      const existing = await Review.countDocuments({ product: prod._id });
      if (existing === 0) {
        for (let i = 0; i < 2; i++) {
          const revData = sampleReviews[(i + prod.name.length) % sampleReviews.length];
          await Review.create({
            product: prod._id,
            user: demoUser._id,
            rating: revData.rating,
            comment: revData.comment,
            isApproved: true,
            isDemoData: false,
          });
        }
      }
    }
    console.log('Seeded verified customer reviews across top products.');
  }

  console.log('Feature seeding completed!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
