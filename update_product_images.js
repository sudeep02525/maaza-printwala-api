import mongoose from 'mongoose';
import Product from './src/models/Product.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/maaza-printwala';

async function updateProductImages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');
    
    // Update Diamond
    const diamond = await Product.findOneAndUpdate(
      { name: /Diamond/i },
      { images: ['diamond_visiting_card.png'] },
      { new: true }
    );
    console.log("Updated Diamond Product:", diamond ? diamond.name : "Not Found");

    // Update Kraft
    const kraft = await Product.findOneAndUpdate(
      { name: /Kraft/i },
      { images: ['kraft_visiting_card.png'] },
      { new: true }
    );
    console.log("Updated Kraft Product:", kraft ? kraft.name : "Not Found");
    
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

updateProductImages();
