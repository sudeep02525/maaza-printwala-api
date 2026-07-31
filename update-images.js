import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maaza-printwala';

const updateImages = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const products = await Product.find({});
    
    for (let p of products) {
      let img = '/images/cat_clothing_new_1785478162007.png'; // default fallback
      const name = p.name.toLowerCase();
      
      if (name.includes('visiting card') || name.includes('business card')) {
        img = '/images/explore_business_cards_1785478383406.png';
      }
      else if (name.includes('card')) {
        img = '/images/cat_visiting_cards_new_1785478123231.png';
      }
      else if (name.includes('banner') || name.includes('sign') || name.includes('flex')) {
        img = '/images/cat_flyers_brochures_1785433655247.png';
      }
      else if (name.includes('polo')) {
        img = '/images/cat_polo_new_1785478171451.png';
      }
      else if (name.includes('t-shirt') || name.includes('shirt')) {
        img = '/images/explore_tshirts_1785478392413.png';
      }
      else if (name.includes('mug')) {
        img = '/images/cat_mugs_new_1785478141544.png';
      }
      else if (name.includes('notebook') || name.includes('diary')) {
        img = '/images/cat_notebooks_new_1785478132458.png';
      }
      else if (name.includes('flyer') || name.includes('brochure')) {
        img = '/images/cat_flyers_brochures_1785433655247.png';
      }
      else if (name.includes('pvc') || name.includes('id ')) {
        img = '/images/cat_industry_1785433735322.png';
      }
      else if (name.includes('packaging')) {
        img = '/images/cat_packaging_1785433687115.png';
      }
      
      p.images = [img];
      await p.save();
    }
    
    console.log('Images updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateImages();
