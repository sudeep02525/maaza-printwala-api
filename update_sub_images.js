import mongoose from 'mongoose';
import Category from './src/models/Category.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/maaza-printwala';

async function updateImages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');
    
    const categories = await Category.find();
    let updated = false;

    for (const cat of categories) {
      if (cat.subcategoryGroups) {
        for (const group of cat.subcategoryGroups) {
          if (group.items) {
            for (const item of group.items) {
              if (item.slug === 'diamond-visiting-cards') {
                item.image = 'diamond_visiting_card.png';
                updated = true;
                console.log('Updated Diamond Card in group', group.name);
              }
              if (item.slug === 'kraft-visiting-cards') {
                item.image = 'kraft_visiting_card.png';
                updated = true;
                console.log('Updated Kraft Card in group', group.name);
              }
            }
          }
        }
      }
      if (updated) {
        await cat.save();
        updated = false;
      }
    }
    console.log('Done updating.');
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

updateImages();
