import mongoose from 'mongoose';
import Product from './src/models/Product.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maaza-printwala')
  .then(async () => {
    // Find the product
    const product = await Product.findOne({ name: 'Standard Visiting Card' });
    
    if (product) {
       console.log('Found product:', product.name, product.slug);
       
       // Delete image files
       if (product.images && product.images.length > 0) {
           for (const imgPath of product.images) {
               console.log('Deleting image:', imgPath);
               
               // Delete from API public folder
               const apiImgPath = path.join(process.cwd(), 'public', imgPath.replace(/^\//, ''));
               if (fs.existsSync(apiImgPath)) {
                   fs.unlinkSync(apiImgPath);
                   console.log('Deleted from API:', apiImgPath);
               }
               
               // Delete from Web public folder
               const webImgPath = path.join(process.cwd(), '..', 'maaza-printwala-web', 'public', imgPath.replace(/^\//, ''));
               if (fs.existsSync(webImgPath)) {
                   fs.unlinkSync(webImgPath);
                   console.log('Deleted from Web:', webImgPath);
               }
           }
       }
       
       // Delete from DB
       await Product.deleteOne({ _id: product._id });
       console.log('Product deleted from database.');
    } else {
       console.log('Product not found.');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
