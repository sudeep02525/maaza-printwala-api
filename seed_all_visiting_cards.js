import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://user:pass@cluster.mongodb.net/test')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Dynamic imports because of schema references
const loadModels = async () => {
  const Category = (await import('./src/models/Category.js')).default;
  const Product = (await import('./src/models/Product.js')).default;
  return { Category, Product };
};

const seed = async () => {
  try {
    const { Category, Product } = await loadModels();

    const visitingCardsCategory = await Category.findOne({ slug: 'visiting-cards' });
    if (!visitingCardsCategory) {
      console.error('Category "visiting-cards" not found!');
      process.exit(1);
    }

    const cards = [
      { name: 'Standard Visiting Cards', image: 'standard_visiting_card_1785947757902.png' },
      { name: 'Classic Visiting Cards', image: 'standard_visiting_card_1785947757902.png' },
      { name: 'Rounded Corner Visiting Cards', image: 'rounded_visiting_card_1785947777870.png' },
      { name: 'Square Visiting Cards', image: 'square_visiting_card_1785947789963.png' },
      { name: 'Leaf Visiting Cards', image: 'standard_visiting_card_1785947757902.png' },
      { name: 'Oval Visiting Cards', image: 'rounded_visiting_card_1785947777870.png' },
      { name: 'Circle Visiting Cards', image: 'rounded_visiting_card_1785947777870.png' },
      { name: 'Custom Shape Visiting Cards', image: 'standard_visiting_card_1785947757902.png' },
      { name: 'Spot UV Visiting Cards', image: 'standard_visiting_card_1785947757902.png' },
      { name: 'Raised Foil Visiting Cards', image: 'standard_visiting_card_1785947757902.png' },
      { name: 'Glossy Visiting Cards', image: 'standard_visiting_card_1785947757902.png' },
      { name: 'Matte Visiting Cards', image: 'standard_visiting_card_1785947757902.png' },
      { name: 'Bulk Visiting Cards', image: 'standard_visiting_card_1785947757902.png' },
      { name: 'Magnetic Visiting Cards', image: 'magnetic_visiting_card_1785947801266.png' },
      { name: 'Transparent Visiting Cards', image: 'transparent_visiting_card_1785947767352.png' },
      { name: 'Premium Plus Visiting Cards', image: 'standard_visiting_card_1785947757902.png' },
      { name: 'Non-Tearable Visiting Cards', image: 'standard_visiting_card_1785947757902.png' },
      { name: 'Velvet Touch Visiting Cards', image: 'standard_visiting_card_1785947757902.png' },
      { name: 'Pearl Visiting Cards', image: 'standard_visiting_card_1785947757902.png' },
      { name: 'Kraft Visiting Cards', image: 'standard_visiting_card_1785947757902.png' },
      { name: 'Diamond Visiting Cards', image: 'standard_visiting_card_1785947757902.png' },
      { name: 'QR Code Visiting Cards', image: 'standard_visiting_card_1785947757902.png' }
    ];

    const sourceDir = `C:\\Users\\aa\\.gemini\\antigravity-ide\\brain\\f9c640cb-f9fb-4a6b-a287-816d2e8ba13d`;
    const destDir = path.join(__dirname, '..', 'maaza-printwala-web', 'public', 'images', 'products');
    
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const insertedProducts = [];

    for (const card of cards) {
      const srcFile = path.join(sourceDir, card.image);
      const destFile = path.join(destDir, card.image);
      if (fs.existsSync(srcFile) && !fs.existsSync(destFile)) {
        fs.copyFileSync(srcFile, destFile);
      }

      const slug = card.name.toLowerCase().replace(/ /g, '-');
      
      const productObj = {
        name: card.name,
        slug: slug,
        category: visitingCardsCategory._id,
        shortDescription: `High-quality ${card.name.toLowerCase()} for professional networking.`,
        description: `Create a lasting impression with our premium ${card.name}. Printed on high-quality materials with stunning detail and vibrant colors.`,
        basePrice: card.name.includes('Premium') || card.name.includes('Magnetic') ? 350 : 200,
        isActive: true,
        isFeatured: true,
        images: [`/images/products/${card.image}`],
      };

      await Product.findOneAndUpdate({ slug: slug }, productObj, { upsert: true, new: true });
      insertedProducts.push(card.name);
    }

    console.log(`Successfully seeded ${insertedProducts.length} visiting cards!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seed();
