import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './src/models/Category.js';
import Product from './src/models/Product.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // Clear existing (if any)
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Create Categories
    const categories = await Category.insertMany([
      { name: 'Business Cards', slug: 'business-cards', isActive: true },
      { name: 'T-Shirts', slug: 't-shirts', isActive: true },
      { name: 'Mugs & Drinkware', slug: 'mugs', isActive: true },
      { name: 'Corporate Gifts', slug: 'corporate-gifts', isActive: true },
      { name: 'Packaging', slug: 'packaging', isActive: true },
    ]);

    console.log('Categories seeded!');

    // Create Products
    const products = [
      {
        name: 'Premium Standard Business Cards',
        slug: 'premium-standard-business-cards',
        category: categories[0]._id,
        description: 'High quality standard business cards for your company.',
        basePrice: 199,
        isActive: true,
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=400&q=80']
      },
      {
        name: 'Custom Printed Cotton T-Shirt',
        slug: 'custom-cotton-tshirt',
        category: categories[1]._id,
        description: '100% Cotton custom printed t-shirts.',
        basePrice: 399,
        isActive: true,
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80']
      },
      {
        name: 'Personalized Coffee Mug',
        slug: 'personalized-coffee-mug',
        category: categories[2]._id,
        description: 'Ceramic personalized coffee mug.',
        basePrice: 249,
        isActive: true,
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=400&q=80']
      },
      {
        name: 'Corporate Welcome Kit',
        slug: 'corporate-welcome-kit',
        category: categories[3]._id,
        description: 'Welcome kit with diary, pen, and bottle.',
        basePrice: 1499,
        isActive: true,
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1542744094-3a3e2203538c?auto=format&fit=crop&w=400&q=80']
      },
      {
        name: 'Custom Corrugated Boxes',
        slug: 'custom-corrugated-boxes',
        category: categories[4]._id,
        description: 'Sturdy packaging boxes for e-commerce.',
        basePrice: 49,
        isActive: true,
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=400&q=80']
      }
    ];

    await Product.insertMany(products);
    console.log('Products seeded!');

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
