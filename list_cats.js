import mongoose from 'mongoose';
import Category from './src/models/Category.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/maaza-printwala';

async function listCats() {
  try {
    await mongoose.connect(MONGODB_URI);
    const cats = await Category.find({ name: /Visiting Cards/i }, 'name slug image');
    console.log(cats);
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
listCats();
