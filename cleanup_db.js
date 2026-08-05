import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://user:pass@cluster.mongodb.net/test')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const loadModels = async () => {
  const Product = (await import('./src/models/Product.js')).default;
  const Category = (await import('./src/models/Category.js')).default;
  return { Product, Category };
};

const cleanup = async () => {
  try {
    const { Product, Category } = await loadModels();

    const deleted = await Product.deleteMany({
      $or: [
        { isDemoData: true },
        { name: { $regex: /[0-9]+$/ } } 
      ]
    });
    console.log(`Deleted ${deleted.deletedCount} old junk products.`);

    const destDir = 'C:\\maaza-printwala\\maaza-printwala-web\\public\\images\\products';
    const files = fs.readdirSync(destDir);
    
    const getImg = (prefix) => {
      const matching = files.filter(f => f.startsWith(prefix) && f.endsWith('.png'));
      if (matching.length === 0) return null;
      return matching[0];
    };

    const mapping = {
      'standard-visiting-cards': getImg('v2_standard'),
      'classic-visiting-cards': getImg('v2_standard'),
      'rounded-corner-visiting-cards': getImg('v2_rounded'),
      'square-visiting-cards': getImg('v2_standard'),
      'leaf-visiting-cards': getImg('v2_velvet'),
      'oval-visiting-cards': getImg('v2_rounded'),
      'circle-visiting-cards': getImg('v2_rounded'),
      'custom-shape-visiting-cards': getImg('v2_velvet'),
      'spot-uv-visiting-cards': getImg('v2_spot_uv'),
      'raised-foil-visiting-cards': getImg('v2_spot_uv'),
      'glossy-visiting-cards': getImg('v2_glossy'),
      'matte-visiting-cards': getImg('v2_matte'),
      'bulk-visiting-cards': getImg('v2_standard'),
      'magnetic-visiting-cards': getImg('v2_premium'),
      'transparent-visiting-cards': getImg('v2_glossy'),
      'premium-plus-visiting-cards': getImg('v2_premium'),
      'non-tearable-visiting-cards': getImg('v2_matte'),
      'velvet-touch-visiting-cards': getImg('v2_velvet'),
      'pearl-visiting-cards': getImg('v2_premium'),
      'kraft-visiting-cards': getImg('v2_qrcode'),
      'diamond-visiting-cards': getImg('v2_premium'),
      'qr-code-visiting-cards': getImg('v2_qrcode')
    };

    for (const [slug, imgFile] of Object.entries(mapping)) {
      if (imgFile) {
        await Product.findOneAndUpdate(
          { slug: slug },
          { $set: { images: [`/images/products/${imgFile}`] } }
        );
        console.log(`Updated ${slug} with ${imgFile}`);
      }
    }

    await Category.deleteOne({ slug: 'business-printing' });

    console.log('Cleanup and update complete.');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

cleanup();
