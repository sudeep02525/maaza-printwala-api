import 'dotenv/config';
import mongoose from 'mongoose';
import Product from './src/models/Product.js';

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // 1. Un-feature everything
  await Product.updateMany({}, { isFeatured: false });
  
  // 2. Find all visiting cards
  const cards = await Product.find({ slug: /visiting-card|business-card/ }).limit(20);
  
  console.log(`Found ${cards.length} visiting cards.`);
  
  // We need 6 distinct images. If they don't have distinct images, we can assign them.
  const distinctImages = [
    'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80', // standard
    'https://images.unsplash.com/photo-1574751508226-f40445d31599?auto=format&fit=crop&w=800&q=80', // corporate
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80', // premium
    'https://images.unsplash.com/photo-1629729802306-2c9bb52c2199?auto=format&fit=crop&w=800&q=80', // modern
    'https://images.unsplash.com/photo-1563969018090-67c439162985?auto=format&fit=crop&w=800&q=80', // creative
    'https://images.unsplash.com/photo-1631522037628-98e98031e428?auto=format&fit=crop&w=800&q=80'  // minimalist
  ];
  
  // 3. Mark 6 of them as featured and assign images
  for (let i = 0; i < Math.min(6, cards.length); i++) {
    const card = cards[i];
    card.isFeatured = true;
    card.images = [distinctImages[i]];
    await card.save();
    console.log(`Updated ${card.name.en || card.name}`);
  }
  
  console.log('Done!');
  await mongoose.disconnect();
}

fix();
