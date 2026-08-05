import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Category from './src/models/Category.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const targetCategorySlugs = [
  'visiting-cards',
  'stationery',
  'flyers-brochures',
  'packaging',
  'labels-stickers',
  'signage-banners',
  'custom-apparel',
  'corporate-gifts',
  'drinkware',
  'photo-prints',
  'invitations'
];

const updateNav = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // 1. Deactivate all categories not in the list
    await Category.updateMany(
      { slug: { $nin: targetCategorySlugs } },
      { $set: { isActive: false } }
    );
    console.log('Deactivated old categories.');

    // 2. Activate the ones in the list and set sort order
    for (let i = 0; i < targetCategorySlugs.length; i++) {
      await Category.updateOne(
        { slug: targetCategorySlugs[i] },
        { $set: { isActive: true, sortOrder: i } }
      );
    }
    console.log('Activated target categories and set sort order.');

    // 3. Migrate subcategoryGroups from business-printing to visiting-cards
    const businessPrinting = await Category.findOne({ slug: 'business-printing' });
    const visitingCards = await Category.findOne({ slug: 'visiting-cards' });

    if (businessPrinting && businessPrinting.subcategoryGroups && visitingCards) {
      if (visitingCards.subcategoryGroups.length === 0) {
        visitingCards.subcategoryGroups = businessPrinting.subcategoryGroups;
        await visitingCards.save();
        console.log('Migrated subcategories to Visiting Cards.');
      }
    } else {
      // If business-printing doesn't exist, we should seed the subcategories directly
      if (visitingCards && visitingCards.subcategoryGroups.length === 0) {
        visitingCards.subcategoryGroups = [
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
        await visitingCards.save();
        console.log('Seeded subcategories to Visiting Cards.');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
};

updateNav();
