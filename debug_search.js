import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';
import Category from './src/models/Category.js';
import { initSearchEngine, getSuggestions, searchProducts } from './src/services/search.service.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Re-initialize to ensure fresh state
  await initSearchEngine();
  
  const products = await Product.find({ isActive: true }).populate('category');
  
  console.log("\n--- 1. ACTIVE PRODUCTS ---");
  console.log(`Total active products: ${products.length}`);
  
  console.log("\n--- 3. SHIRT-RELATED PRODUCTS ---");
  const shirtProducts = products.filter(p => p.name.toLowerCase().includes('shirt') || (p.category && p.category.name.toLowerCase().includes('shirt')));
  
  shirtProducts.forEach(p => {
     console.log(`Name: ${p.name}`);
     console.log(`Category: ${p.category?.name}`);
     console.log(`Keywords: ${JSON.stringify(p.keywords)}`);
     console.log("-------------------");
  });
  
  console.log("\n--- 4. RAW FUSE RESULTS FOR 'shirt' ---");
  const fuseResults = searchProducts('shirt');
  console.log(`Matched Products: ${fuseResults.length}`);
  fuseResults.forEach(p => {
     console.log(`- ${p.name}`);
  });
  
  console.log("\n--- 5. FINAL API RESPONSE FOR 'shirt' ---");
  const suggestions = getSuggestions('shirt');
  console.log(JSON.stringify(suggestions, null, 2));

  await mongoose.disconnect();
  process.exit(0);
}
run();
