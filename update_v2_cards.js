import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://user:pass@cluster.mongodb.net/test')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const loadModels = async () => {
  const Product = (await import('./src/models/Product.js')).default;
  return { Product };
};

const updateImages = async () => {
  try {
    const { Product } = await loadModels();

    const brainDir = 'C:\\Users\\aa\\.gemini\\antigravity-ide\\brain\\f9c640cb-f9fb-4a6b-a287-816d2e8ba13d';
    const destDir = path.join(__dirname, '..', 'maaza-printwala-web', 'public', 'images', 'products');

    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const files = fs.readdirSync(brainDir);
    
    const findNewest = (prefix) => {
      const matching = files.filter(f => f.startsWith(prefix) && f.endsWith('.png'));
      if (matching.length === 0) return null;
      matching.sort((a, b) => {
        return fs.statSync(path.join(brainDir, b)).mtimeMs - fs.statSync(path.join(brainDir, a)).mtimeMs;
      });
      return matching[0];
    };

    const mapping = {
      'standard-visiting-cards': findNewest('v2_standard_card'),
      'glossy-visiting-cards': findNewest('v2_glossy_card'),
      'matte-visiting-cards': findNewest('v2_matte_card'),
      'spot-uv-visiting-cards': findNewest('v2_spot_uv_card'),
      'rounded-corner-visiting-cards': findNewest('v2_rounded_card'),
      'velvet-touch-visiting-cards': findNewest('v2_velvet_card'),
      'qr-code-visiting-cards': findNewest('v2_qrcode_card'),
      'premium-plus-visiting-cards': findNewest('v2_premium_card'),
    };

    for (const [slug, imgFile] of Object.entries(mapping)) {
      if (imgFile) {
        fs.copyFileSync(path.join(brainDir, imgFile), path.join(destDir, imgFile));
        const result = await Product.findOneAndUpdate(
          { slug: slug },
          { $set: { images: [`/images/products/${imgFile}`] } }
        );
        if (result) {
          console.log(`Updated ${slug} with image ${imgFile}`);
        } else {
          console.log(`Could not find product ${slug} in DB`);
        }
      } else {
        console.log(`No image found for ${slug}`);
      }
    }

    console.log('Update complete.');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

updateImages();
