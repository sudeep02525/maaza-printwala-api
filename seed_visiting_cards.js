import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './src/models/Category.js';
import Product from './src/models/Product.js';

dotenv.config();

const seedVisitingCards = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // Find or create category 'business-printing'
    let category = await Category.findOne({ slug: 'business-printing' });
    if (!category) {
      category = await Category.create({
        name: 'Business Printing',
        slug: 'business-printing',
        isActive: true
      });
      console.log('Created category business-printing');
    }

    const cards = [];
    const images = [
      '/images/subcategories/visiting_cards.png',
      '/images/subcategories/pvc_cards.png',
      '/images/subcategories/nfc_cards.png',
      'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1605371924599-2d0365da26f5?auto=format&fit=crop&w=400&q=80',
    ];

    const variations = ['Matte', 'Glossy', 'Spot UV', 'Gold Foil', 'Velvet Touch', 'Textured', 'Transparent', 'Square', 'Rounded Corners', 'Die-Cut'];
    
    for (let i = 1; i <= 30; i++) {
      const variant = variations[i % variations.length];
      const name = `Premium ${variant} Visiting Card ${i}`;
      const slug = `premium-${variant.toLowerCase().replace(/ /g, '-')}-visiting-card-${i}`;
      
      cards.push({
        name,
        slug,
        category: category._id,
        shortDescription: `High-quality ${variant.toLowerCase()} visiting card perfect for networking.`,
        description: `Elevate your professional image with our ${name}. Crafted with precision and premium materials for a lasting impression.`,
        basePrice: Math.floor(Math.random() * 500) + 199,
        isActive: true,
        isFeatured: i % 5 === 0,
        isDemoData: true,
        images: [images[i % images.length]],
      });
    }

    // Delete old visiting cards if any (optional, but good to prevent duplicate key errors if slug exists)
    for (const card of cards) {
      await Product.deleteOne({ slug: card.slug });
    }

    await Product.insertMany(cards);
    console.log(`Successfully inserted ${cards.length} visiting card products!`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedVisitingCards();
