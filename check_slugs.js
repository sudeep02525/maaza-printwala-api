import mongoose from 'mongoose';
import Category from './src/models/Category.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/maaza-printwala';

async function listItems() {
  try {
    await mongoose.connect(MONGODB_URI);
    const categories = await Category.find();
    for (const cat of categories) {
      if (cat.subcategoryGroups) {
        for (const group of cat.subcategoryGroups) {
          if (group.items) {
            for (const item of group.items) {
              if (item.name.includes('Kraft') || item.name.includes('Diamond')) {
                console.log(item.name, '->', item.slug, 'img:', item.image);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
listItems();
