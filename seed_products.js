import mongoose from 'mongoose';
import Product from './src/models/Product.js';
import Category from './src/models/Category.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'products');

function formatName(filename) {
  // e.g. "magnetic_visiting_card_1785947801266.png" -> "Magnetic Visiting Card"
  let name = filename.replace('.png', '').replace('.jpg', '').replace('.jpeg', '');
  // Remove numbers from the end
  name = name.replace(/_\d+$/, '');
  // Remove "v2_" prefix
  name = name.replace(/^v2_/, '');
  
  return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maaza-printwala')
  .then(async () => {
    
    // Find or create category "Visiting Cards"
    let category = await Category.findOne({ slug: 'visiting-cards' });
    if (!category) {
      category = new Category({
        name: 'Visiting Cards',
        slug: 'visiting-cards',
        description: 'Custom designed visiting cards'
      });
      await category.save();
    }
    
    const files = fs.readdirSync(IMAGES_DIR);
    
    for (const file of files) {
       const productName = formatName(file);
       const slug = productName.toLowerCase().replace(/\s+/g, '-');
       
       const existingProduct = await Product.findOne({ slug });
       
       if (existingProduct) {
          existingProduct.images = [`/images/products/${file}`];
          await existingProduct.save();
          console.log(`Updated images for: ${productName}`);
       } else {
          const newProduct = new Product({
             name: productName,
             slug: slug,
             category: category._id,
             categoryName: category.name,
             basePrice: Math.floor(Math.random() * 500) + 100, // random price between 100-600
             shortDescription: `High quality ${productName.toLowerCase()} for your business.`,
             images: [`/images/products/${file}`],
             keywords: ['visiting card', 'business card', productName.toLowerCase()],
             isActive: true,
             isDemoData: true
          });
          await newProduct.save();
          console.log(`Inserted: ${productName}`);
       }
    }
    
    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
