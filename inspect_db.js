import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';
import Category from './src/models/Category.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Categories:");
  const cats = await Category.find().limit(5);
  cats.forEach(c => console.log(c.name));
  
  console.log("\nProducts:");
  const prods = await Product.find().populate('category').limit(5);
  prods.forEach(p => {
    console.log(`- ${p.name} [Cat: ${p.category?.name}]`);
    console.log(`  Keywords: ${p.keywords.join(', ')}`);
  });
  
  process.exit(0);
}
run();
