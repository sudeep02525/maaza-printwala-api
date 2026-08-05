const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Product = require('./src/models/Product.js').default || require('./src/models/Product.js');
  const Category = require('./src/models/Category.js').default || require('./src/models/Category.js');

  const paperCategory = await Category.findOne({ slug: 'stationery' }) || await Category.findOne({});
  const clothingCategory = await Category.findOne({ slug: 'custom-apparel' }) || await Category.findOne({});
  const subCategory = await Category.findOne({ slug: 'corporate-gifts' }) || await Category.findOne({});
  const promoCategory = await Category.findOne({ slug: 'promotional-items' }) || await Category.findOne({});

  const products = [
    {
      name: 'Custom Printed Cotton T-Shirt',
      slug: 'custom-cotton-tshirt',
      category: clothingCategory._id,
      description: '100% Cotton custom printed t-shirts.',
      basePrice: 399,
      isActive: true,
      isFeatured: true,
      images: ['/images/cotton_tshirt.png']
    },
    {
      name: 'Personalized Coffee Mug',
      slug: 'personalized-coffee-mug',
      category: subCategory._id,
      description: 'Ceramic personalized coffee mug.',
      basePrice: 249,
      isActive: true,
      isFeatured: true,
      images: ['/images/coffee_mug.png']
    },
    {
      name: 'Corporate Welcome Kit',
      slug: 'corporate-welcome-kit',
      category: promoCategory._id,
      description: 'Welcome kit with diary, pen, and bottle.',
      basePrice: 1499,
      isActive: true,
      isFeatured: true,
      images: ['/images/corporate_welcome_kit.png']
    },
    {
      name: 'Custom Corrugated Boxes',
      slug: 'custom-corrugated-boxes',
      category: paperCategory._id,
      description: 'Sturdy packaging boxes for e-commerce.',
      basePrice: 49,
      isActive: true,
      isFeatured: true,
      images: ['/images/corrugated_boxes.png']
    },
    {
      name: 'Embroidered Polo Shirt',
      slug: 'embroidered-polo-shirt',
      category: clothingCategory._id,
      description: 'Premium polo shirts with custom embroidery.',
      basePrice: 599,
      isActive: true,
      isFeatured: true,
      images: ['/images/polo_shirt.png']
    },
    {
      name: 'Executive Letterhead',
      slug: 'executive-letterhead',
      category: paperCategory._id,
      description: 'Professional letterheads for executive communication.',
      basePrice: 99,
      isActive: true,
      isFeatured: true,
      images: ['/images/executive_letterhead.png']
    },
    {
      name: 'Outdoor Vinyl Banner',
      slug: 'outdoor-vinyl-banner',
      category: paperCategory._id,
      description: 'Durable vinyl banners for outdoor advertising.',
      basePrice: 899,
      isActive: true,
      isFeatured: true,
      images: ['/images/outdoor_banner.png']
    }
  ];

  for (const p of products) {
    await Product.findOneAndUpdate({ slug: p.slug }, p, { upsert: true });
    console.log('Restored: ' + p.slug);
  }

  process.exit(0);
});
