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
      { name: 'Paper Printing Products', slug: 'paper-printing-products', isActive: true },
      { name: 'Pens', slug: 'pens', isActive: true },
      { name: 'Clothing', slug: 'clothing', isActive: true },
      { name: 'Caps', slug: 'caps', isActive: true },
      { name: 'Office Products', slug: 'office-products', isActive: true },
      { name: 'canvas', slug: 'canvas', isActive: true },
      { name: 'Sublimation Gifting Products', slug: 'sublimation-gifting-products', isActive: true },
      { name: 'Personalise Products', slug: 'personalise-products', isActive: true },
      { name: 'Wooden Products', slug: 'wooden-products', isActive: true },
      { name: 'Promotional Items', slug: 'promotional-items', isActive: true },
    ]);

    console.log('Categories seeded!');

    // Create Products
    const products = [
      {
        name: 'Premium Standard Business Cards',
        slug: 'premium-standard-business-cards',
        category: categories[0]._id, // Paper Printing
        description: 'High quality standard business cards for your company.',
        basePrice: 199,
        isActive: true,
        isFeatured: true,
        images: ['/images/business_cards.png']
      },
      {
        name: 'Custom Printed Cotton T-Shirt',
        slug: 'custom-cotton-tshirt',
        category: categories[2]._id, // Clothing
        description: '100% Cotton custom printed t-shirts.',
        basePrice: 399,
        isActive: true,
        isFeatured: true,
        images: ['/images/cotton_tshirt.png']
      },
      {
        name: 'Personalized Coffee Mug',
        slug: 'personalized-coffee-mug',
        category: categories[6]._id, // Sublimation
        description: 'Ceramic personalized coffee mug.',
        basePrice: 249,
        isActive: true,
        isFeatured: true,
        images: ['/images/coffee_mug.png']
      },
      {
        name: 'Corporate Welcome Kit',
        slug: 'corporate-welcome-kit',
        category: categories[9]._id, // Promotional
        description: 'Welcome kit with diary, pen, and bottle.',
        basePrice: 1499,
        isActive: true,
        isFeatured: true,
        images: ['/images/corporate_welcome_kit.png']
      },
      {
        name: 'Custom Corrugated Boxes',
        slug: 'custom-corrugated-boxes',
        category: categories[0]._id, // Paper
        description: 'Sturdy packaging boxes for e-commerce.',
        basePrice: 49,
        isActive: true,
        isFeatured: true,
        images: ['/images/corrugated_boxes.png']
      },
      {
        name: 'Embroidered Polo Shirt',
        slug: 'embroidered-polo-shirt',
        category: categories[2]._id, // Clothing
        description: 'Premium polo shirts with custom embroidery.',
        basePrice: 599,
        isActive: true,
        isFeatured: true,
        images: ['/images/polo_shirt.png']
      },
      {
        name: 'Executive Letterhead',
        slug: 'executive-letterhead',
        category: categories[0]._id, // Paper
        description: 'Professional letterheads for executive communication.',
        basePrice: 99,
        isActive: true,
        isFeatured: true,
        images: ['/images/executive_letterhead.png']
      },
      {
        name: 'Outdoor Vinyl Banner',
        slug: 'outdoor-vinyl-banner',
        category: categories[0]._id, // Paper
        description: 'Durable vinyl banners for outdoor advertising.',
        basePrice: 899,
        isActive: true,
        isFeatured: true,
        images: ['/images/outdoor_banner.png']
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
