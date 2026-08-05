import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Category from './src/models/Category.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const updateMegaMenu = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const vistaprintGroups = [
      {
        name: 'Visiting Cards',
        items: [
          { name: 'Standard Visiting Cards', slug: 'standard-visiting-cards' },
          { name: 'Classic Visiting Cards', slug: 'classic-visiting-cards' },
          { name: 'Rounded Corner Visiting Cards', slug: 'rounded-corner-visiting-cards' },
          { name: 'Square Visiting Cards', slug: 'square-visiting-cards' },
          { name: 'Leaf Visiting Cards', slug: 'leaf-visiting-cards', isNew: true },
          { name: 'Oval Visiting Cards', slug: 'oval-visiting-cards', isNew: true },
          { name: 'Circle Visiting Cards', slug: 'circle-visiting-cards', isNew: true },
          { name: 'Custom Shape Visiting Cards', slug: 'custom-shape-visiting-cards', isNew: true },
        ]
      },
      {
        name: 'Brilliant Finishes',
        items: [
          { name: 'Spot UV Visiting Cards', slug: 'spot-uv-visiting-cards' },
          { name: 'Raised Foil Visiting Cards', slug: 'raised-foil-visiting-cards' },
        ]
      },
      {
        name: 'Standard Papers',
        items: [
          { name: 'Glossy Visiting Cards', slug: 'glossy-visiting-cards' },
          { name: 'Matte Visiting Cards', slug: 'matte-visiting-cards' },
          { name: 'Bulk Visiting Cards', slug: 'bulk-visiting-cards', isNew: true },
        ]
      },
      {
        name: 'Specialty Cards',
        items: [
          { name: 'Magnetic Visiting Cards', slug: 'magnetic-visiting-cards' },
          { name: 'Transparent Visiting Cards', slug: 'transparent-visiting-cards' },
        ]
      },
      {
        name: 'Premium Papers',
        items: [
          { name: 'Premium Plus Visiting Cards', slug: 'premium-plus-visiting-cards' },
          { name: 'Non-Tearable Visiting Cards', slug: 'non-tearable-visiting-cards' },
          { name: 'Velvet Touch Visiting Cards', slug: 'velvet-touch-visiting-cards' },
          { name: 'Pearl Visiting Cards', slug: 'pearl-visiting-cards', isNew: true },
          { name: 'Kraft Visiting Cards', slug: 'kraft-visiting-cards', isNew: true },
          { name: 'Diamond Visiting Cards', slug: 'diamond-visiting-cards', isNew: true },
        ]
      },
      {
        name: 'Digital Visiting Cards',
        items: [
          { name: 'QR Code Visiting Cards', slug: 'qr-code-visiting-cards' },
        ]
      }
    ];

    const allCats = await Category.find();
    console.log('All category slugs:', allCats.map(c => c.slug));

    const category = await Category.findOne({ slug: 'business-printing' });
    if (category) {
      category.subcategoryGroups = vistaprintGroups;
      await category.save();
      console.log('Update successful!');
    } else {
      console.log('Category not found!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
};

updateMegaMenu();
