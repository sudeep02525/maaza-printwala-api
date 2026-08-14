import mongoose from 'mongoose';
import Product from './src/models/Product.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/maaza-printwala';

async function listProds() {
  try {
    await mongoose.connect(MONGODB_URI);
    const prods = await Product.find({ name: /Visiting Cards/i }, 'name slug image');
    console.log(prods);
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
listProds();
