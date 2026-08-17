import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';

dotenv.config();

// Common typos and synonyms dictionary
const TYPO_MAP = {
  'visiting': ['visitng', 'vistng', 'visiting', 'bussines', 'business', 'name', 'card'],
  'card': ['crd', 'cards', 'card'],
  'premium': ['premuim', 'primium', 'best', 'top', 'premium'],
  'matte': ['mat', 'matt', 'mate', 'matte'],
  'glossy': ['glosy', 'gloss', 'shine', 'glossy'],
  't-shirt': ['tshirt', 'tshrt', 'teeshirt', 't shirt', 't-shirts'],
  'mug': ['mugs', 'cup', 'coffee mug'],
  'flyer': ['flier', 'pamphlet', 'leaflet', 'flyers'],
  'banner': ['baner', 'hoarding', 'flex', 'banners']
};

const addKeywordsToProducts = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const products = await Product.find({});
    console.log(`Found ${products.length} products. Updating keywords...`);

    let updatedCount = 0;

    for (const product of products) {
      let keywordsSet = new Set(product.keywords || []);
      
      // Tokenize product name
      const words = product.name.toLowerCase().split(/[^a-z0-9]+/);
      
      for (const word of words) {
        if (!word) continue;
        
        // Add the exact word
        keywordsSet.add(word);
        
        // Add typos if exists in map
        for (const [key, typos] of Object.entries(TYPO_MAP)) {
          if (word.includes(key) || key.includes(word)) {
            typos.forEach(t => keywordsSet.add(t));
          }
        }
      }

      product.keywords = Array.from(keywordsSet);
      await product.save();
      updatedCount++;
    }

    console.log(`Successfully updated keywords for ${updatedCount} products!`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating keywords:', error);
    process.exit(1);
  }
};

addKeywordsToProducts();
