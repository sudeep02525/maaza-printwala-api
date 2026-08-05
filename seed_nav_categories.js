import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Category from './src/models/Category.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const newCategories = [
  { name: 'Visiting Cards', slug: 'visiting-cards' },
  { name: 'Stationery', slug: 'stationery' },
  { name: 'Flyers & Brochures', slug: 'flyers-brochures' },
  { name: 'Packaging', slug: 'packaging' },
  { name: 'Labels & Stickers', slug: 'labels-stickers' },
  { name: 'Signage & Banners', slug: 'signage-banners' },
  { name: 'Custom Apparel', slug: 'custom-apparel' },
  { name: 'Corporate Gifts', slug: 'corporate-gifts' },
  { name: 'Drinkware', slug: 'drinkware' },
  { name: 'Photo Prints', slug: 'photo-prints' },
  { name: 'Invitations', slug: 'invitations' },
];

const seedNavCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    for (let cat of newCategories) {
      const existing = await Category.findOne({ slug: cat.slug });
      if (!existing) {
        await Category.create({
          name: cat.name,
          slug: cat.slug,
          isActive: true
        });
        console.log(`Created category: ${cat.name}`);
      } else {
        console.log(`Category already exists: ${cat.name}`);
      }
    }

    console.log('Categories seeded successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
};

seedNavCategories();
