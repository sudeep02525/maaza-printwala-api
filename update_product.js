import mongoose from 'mongoose';
import Product from './src/models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maaza-printwala')
  .then(async () => {
    const product = await Product.findOneAndUpdate(
      { slug: 'visiting-cards' },
      { 
        $set: { 
          name: 'Standard Visiting Card', 
          slug: 'standard-visiting-card',
          images: ['/images/business_cards.png']
        } 
      },
      { new: true }
    );
    console.log('Updated product:', product?.name, product?.slug, product?.images);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
