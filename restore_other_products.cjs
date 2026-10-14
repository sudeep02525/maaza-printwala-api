const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Product = require('./src/models/Product.js').default || require('./src/models/Product.js');
  const Category = require('./src/models/Category.js').default || require('./src/models/Category.js');

  const stationery = await Category.findOne({ slug: 'stationery' });
  const apparel = await Category.findOne({ slug: 'custom-apparel' });
  const gifts = await Category.findOne({ slug: 'corporate-gifts' });
  const packaging = await Category.findOne({ slug: 'packaging' });
  const flyers = await Category.findOne({ slug: 'flyers-brochures' });
  const stickers = await Category.findOne({ slug: 'labels-stickers' });

  // Fix PVC ID cards category to stationery
  if (stationery) {
    await Product.updateOne({ slug: 'pvc-id-cards' }, { $set: { category: stationery._id } });
    console.log('Fixed pvc-id-cards category -> stationery');
  }

  const products = [
    {
      name: 'Custom Printed Cotton T-Shirt',
      slug: 'custom-cotton-tshirt',
      category: apparel ? apparel._id : null,
      description: '100% Cotton custom printed t-shirts with durable, vibrant prints.',
      basePrice: 399,
      isActive: true,
      isFeatured: true,
      images: ['/images/cotton_tshirt.png', '/images/cat_tshirt_new_1785478181285.png']
    },
    {
      name: 'Embroidered Polo Shirt',
      slug: 'embroidered-polo-shirt',
      category: apparel ? apparel._id : null,
      description: 'Premium polo shirts with custom embroidered logo on chest.',
      basePrice: 599,
      isActive: true,
      isFeatured: true,
      images: ['/images/polo_shirt.png', '/images/cat_polo_new_1785478171451.png']
    },
    {
      name: 'Personalized Ceramic Coffee Mug',
      slug: 'personalized-coffee-mug',
      category: gifts ? gifts._id : null,
      description: 'High-gloss ceramic mug personalized with high-definition wrap print.',
      basePrice: 249,
      isActive: true,
      isFeatured: true,
      images: ['/images/cat_mugs_new_1785478141544.png', '/images/coffee_mug.png']
    },
    {
      name: 'Corporate Welcome Kit',
      slug: 'corporate-welcome-kit',
      category: gifts ? gifts._id : null,
      description: 'Complete new hire welcome kit with engraved bottle, premium diary, and pen.',
      basePrice: 1499,
      isActive: true,
      isFeatured: true,
      images: ['/images/corporate_welcome_kit.png']
    },
    {
      name: 'Eco-Friendly Corrugated Boxes',
      slug: 'custom-corrugated-boxes',
      category: packaging ? packaging._id : null,
      description: 'Durable, eco-friendly custom printed packaging boxes.',
      basePrice: 49,
      isActive: true,
      isFeatured: true,
      images: ['/images/cat_packaging_1785433687115.png', '/images/corrugated_boxes.png']
    },
    {
      name: 'Executive Corporate Letterhead',
      slug: 'executive-letterhead',
      category: stationery ? stationery._id : null,
      description: 'Premium 100gsm bond paper letterheads for official corporate correspondence.',
      basePrice: 99,
      isActive: true,
      isFeatured: true,
      images: ['/images/executive_letterhead.png']
    },
    {
      name: 'Promotional Marketing Flyers (A5)',
      slug: 'promotional-marketing-flyers',
      category: flyers ? flyers._id : null,
      description: 'Gloss or matte finished double-sided promotional flyers.',
      basePrice: 199,
      isActive: true,
      isFeatured: true,
      images: ['/images/cat_flyers_brochures_1785433655247.png']
    },
    {
      name: 'Custom Die-Cut Sheet Stickers',
      slug: 'custom-die-cut-stickers',
      category: stickers ? stickers._id : null,
      description: 'Waterproof vinyl die-cut stickers for branding and packaging.',
      basePrice: 149,
      isActive: true,
      isFeatured: true,
      images: ['/images/cat_stickers_labels_1785433676109.png']
    }
  ];

  for (const p of products) {
    if (p.category) {
      await Product.findOneAndUpdate({ slug: p.slug }, { $set: p }, { upsert: true });
      console.log('Restored: ' + p.name + ' (' + p.slug + ')');
    }
  }

  console.log('Catalogue successfully enriched across all categories!');
  process.exit(0);
});
