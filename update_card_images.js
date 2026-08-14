import mongoose from 'mongoose';
import Category from './src/models/Category.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/maaza-printwala';

async function updateImages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');
    
    // Update Diamond
    const diamond = await Category.findOneAndUpdate(
      { slug: 'diamond-visiting-cards' },
      { image: 'diamond_visiting_card.png' },
      { new: true }
    );
    console.log("Updated Diamond:", diamond ? "Success" : "Not Found");

    // Update Kraft
    const kraft = await Category.findOneAndUpdate(
      { slug: 'kraft-visiting-cards' },
      { image: 'kraft_visiting_card.png' },
      { new: true }
    );
    console.log("Updated Kraft:", kraft ? "Success" : "Not Found");
    
  } catch (error) {
    console.error('Error updating images:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

updateImages();
