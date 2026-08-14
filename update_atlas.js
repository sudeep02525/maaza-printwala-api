import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

// Define Product schema (since it might not be properly imported outside the app scope)
const productSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    images: [{ type: String }],
  },
  { strict: false }
);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function updateProductImages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Atlas DB');
    
    // Update Diamond
    const diamond = await Product.findOneAndUpdate(
      { slug: 'diamond-visiting-cards' },
      { $set: { "images.0": "/images/products/diamond_visiting_card.png" } },
      { new: true }
    );
    console.log("Updated Diamond Product:", diamond ? diamond.name : "Not Found");
    if (!diamond) {
       // Also try by name if slug fails
       const d2 = await Product.findOneAndUpdate(
         { name: /Diamond/i },
         { $set: { "images.0": "/images/products/diamond_visiting_card.png" } },
         { new: true }
       );
       console.log("Updated Diamond Product by name:", d2 ? d2.name : "Not Found");
    }

    // Update Kraft
    const kraft = await Product.findOneAndUpdate(
      { slug: 'kraft-visiting-cards' },
      { $set: { "images.0": "/images/products/kraft_visiting_card.png" } },
      { new: true }
    );
    console.log("Updated Kraft Product:", kraft ? kraft.name : "Not Found");
    if (!kraft) {
       const k2 = await Product.findOneAndUpdate(
         { name: /Kraft/i },
         { $set: { "images.0": "/images/products/kraft_visiting_card.png" } },
         { new: true }
       );
       console.log("Updated Kraft Product by name:", k2 ? k2.name : "Not Found");
    }
    
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

updateProductImages();
