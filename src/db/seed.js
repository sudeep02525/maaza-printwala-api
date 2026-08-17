import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import { ROLES } from '../constants/roles.constants.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import ProductAttributeSchema from '../models/ProductAttributeSchema.js';
import PricingRule from '../models/PricingRule.js';
import Template from '../models/Template.js';
import CMSContent from '../models/CMSContent.js';
import DeliveryRule from '../models/DeliveryRule.js';

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maaza_printwala');
    console.log('Connected to MongoDB for seeding production catalogue...');

    // Clear existing collection data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      ProductAttributeSchema.deleteMany({}),
      PricingRule.deleteMany({}),
      Template.deleteMany({}),
      CMSContent.deleteMany({}),
      DeliveryRule.deleteMany({}),
    ]);

    console.log('Cleared existing database tables.');

    // 1. Seed Users (Production Admin & Customer Account)
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const userPassword = await bcrypt.hash('user123', salt);

    const adminUser = await User.create({
      name: 'Maaza Admin',
      email: 'admin@maazaprintwala.com',
      password: adminPassword,
      role: ROLES.ADMIN,
      phone: '+919876543210',
    });

    const demoUser = await User.create({
      name: 'Raj Mehta',
      email: 'user@maazaprintwala.com',
      password: userPassword,
      role: ROLES.USER,
      phone: '+919123456780',
    });

    console.log('Users seeded successfully.');

    // 2. Seed Categories (Commercial Printing Architecture)
    const categoryData = [
      {
        name: 'Visiting Cards',
        slug: 'business-printing',
        description: 'Professional visiting cards to make a lasting impression.',
        image: '/images/banner_business_cards.png',
        sortOrder: 1,
        subcategoryGroups: [
          {
            name: 'Cards',
            items: [
              { name: 'Standard Cards', slug: 'standard-cards', image: '/images/subcategories/visiting_cards.png' },
              { name: 'Premium Cards', slug: 'premium-cards', image: '/images/subcategories/premium_cards.png' }
            ]
          },
          {
            name: 'Paper Types',
            items: [
              { name: 'Matte Cards', slug: 'matte-cards' },
              { name: 'Glossy Cards', slug: 'glossy-cards' },
              { name: 'Velvet Cards', slug: 'velvet-cards' },
              { name: 'Kraft Cards', slug: 'kraft-cards' },
              { name: 'Pearl Cards', slug: 'pearl-cards' }
            ]
          },
          {
            name: 'Finishes',
            items: [
              { name: 'Spot UV Cards', slug: 'spot-uv-cards' },
              { name: 'Raised Foil Cards', slug: 'raised-foil-cards' }
            ]
          },
          {
            name: 'Shapes',
            items: [
              { name: 'Rounded Corner Cards', slug: 'rounded-corner-cards' },
              { name: 'Square Cards', slug: 'square-cards' },
              { name: 'Circle Cards', slug: 'circle-cards' },
              { name: 'Oval Cards', slug: 'oval-cards' },
              { name: 'Custom Shape Cards', slug: 'custom-shape-cards' }
            ]
          },
          {
            name: 'Special',
            items: [
              { name: 'Transparent Cards', slug: 'transparent-cards' },
              { name: 'Magnetic Cards', slug: 'magnetic-cards' },
              { name: 'QR Visiting Cards', slug: 'qr-visiting-cards' }
            ]
          },
          {
            name: 'Accessories',
            items: [
              { name: 'Card Holder', slug: 'card-holder' },
              { name: 'Bulk Orders', slug: 'bulk-orders' }
            ]
          }
        ]
      },
      {
        name: 'Stationery',
        slug: 'stationery',
        description: 'Custom stationery items for your office and personal needs.',
        image: '/images/banner_stationery.png',
        sortOrder: 2,
        subcategoryGroups: [
          {
            name: 'Office',
            items: [
              { name: 'Letterheads', slug: 'letterheads', image: '/images/subcategories/letterheads.png' },
              { name: 'Envelopes', slug: 'envelopes', image: '/images/subcategories/envelopes.png' }
            ]
          },
          {
            name: 'Personal',
            items: [
              { name: 'Notebooks', slug: 'notebooks', image: '/images/subcategories/notepads.png' }
            ]
          }
        ]
      },
      {
        name: 'Flyers & Brochures',
        slug: 'flyers-brochures',
        description: 'Promotional materials to help your business stand out.',
        image: '/images/banner_flyers.png',
        sortOrder: 3,
        subcategoryGroups: [
          {
            name: 'Marketing',
            items: [
              { name: 'Flyers', slug: 'flyers', image: '/images/subcategories/flyers.png' },
              { name: 'Bi-Fold Brochures', slug: 'bi-fold-brochures', image: '/images/subcategories/brochures.png' },
              { name: 'Tri-Fold Brochures', slug: 'tri-fold-brochures', image: '/images/subcategories/brochures.png' }
            ]
          }
        ]
      },
      {
        name: 'Packaging',
        slug: 'packaging',
        description: 'Custom packaging solutions to protect your products and promote your brand.',
        image: '/images/banner_packaging.png',
        sortOrder: 4,
        subcategoryGroups: [
          {
            name: 'Bags',
            items: [
              { name: 'Paper Bags', slug: 'paper-bags', image: '/images/subcategories/paper_bags.png' }
            ]
          },
          {
            name: 'Boxes',
            items: [
              { name: 'Gift Boxes', slug: 'gift-boxes', image: '/images/subcategories/gift_boxes.png' },
              { name: 'Shipping Boxes', slug: 'shipping-boxes', image: '/images/subcategories/shipping_boxes.png' }
            ]
          }
        ]
      },
      {
        name: 'Labels & Stickers',
        slug: 'labels-stickers',
        description: 'Custom labels and stickers for all your packaging and branding needs.',
        image: '/images/banner_labels.png',
        sortOrder: 5,
        subcategoryGroups: [
          {
            name: 'Stickers',
            items: [
              { name: 'Die-Cut Stickers', slug: 'die-cut-stickers', image: '/images/subcategories/die_cut_stickers.png' }
            ]
          },
          {
            name: 'Labels',
            items: [
              { name: 'Product Labels', slug: 'product-labels', image: '/images/subcategories/product_labels.png' }
            ]
          }
        ]
      },
      {
        name: 'Signage & Banners',
        slug: 'signage-banners',
        description: 'High-impact indoor and outdoor signage, banners, and boards to capture attention.',
        image: '/images/outdoor_banner.png',
        sortOrder: 6,
        subcategoryGroups: [
          {
            name: 'Outdoor',
            items: [
              { name: 'Vinyl Banners', slug: 'vinyl-banners', image: '/images/subcategories/vinyl.png' },
              { name: 'Flex Banners', slug: 'flex-banners', image: '/images/subcategories/flex.png' }
            ]
          },
          {
            name: 'Indoor',
            items: [
              { name: 'Roll-Up Standees', slug: 'roll-up-standees', image: '/images/subcategories/standees.png' },
              { name: 'Sunboard Printing', slug: 'sunboard-printing', image: '/images/subcategories/sunboard.png' },
              { name: 'Foam Boards', slug: 'foam-boards', image: '/images/subcategories/acrylic.png' }
            ]
          }
        ]
      },
      {
        name: 'Custom Apparel',
        slug: 'custom-apparel',
        description: 'Branded clothing and apparel for your team or events.',
        image: '/images/banner_apparel.png',
        sortOrder: 7,
        subcategoryGroups: [
          {
            name: 'Shirts',
            items: [
              { name: 'T-Shirts', slug: 't-shirts', image: '/images/cat_tshirt_new_1785478181285.png' },
              { name: 'Polo T-Shirts', slug: 'polo-t-shirts', image: '/images/cat_polo_new_1785478171451.png' }
            ]
          },
          {
            name: 'Winter Wear',
            items: [
              { name: 'Hoodies', slug: 'hoodies', image: '/images/subcategories/hoodies.png' }
            ]
          },
          {
            name: 'Headwear',
            items: [
              { name: 'Caps', slug: 'caps', image: '/images/subcategories/caps.png' }
            ]
          }
        ]
      },
      {
        name: 'Corporate Gifts',
        slug: 'corporate-gifts',
        description: 'Thoughtful customized gifts for clients and employees.',
        image: '/images/banner_corporate.png',
        sortOrder: 8,
        subcategoryGroups: [
          {
            name: 'Drinkware',
            items: [
              { name: 'Coffee Mugs', slug: 'coffee-mugs', image: '/images/cat_mugs_new_1785478141544.png' },
              { name: 'Water Bottles', slug: 'water-bottles', image: '/images/subcategories/water_bottles.png' }
            ]
          },
          {
            name: 'Tech',
            items: [
              { name: 'Pen Drives', slug: 'pen-drives', image: '/images/subcategories/pen_drives.png' }
            ]
          },
          {
            name: 'Stationery',
            items: [
              { name: 'Diaries & Organizers', slug: 'diaries-organizers', image: '/images/subcategories/notepads.png' }
            ]
          }
        ]
      }
    ];

    const createdCategories = {};
    for (const catData of categoryData) {
      const category = await Category.create(catData);
      createdCategories[category.slug] = category;
    }

    console.log('Categories seeded successfully.');

    // 3. Seed Production Catalogue Products
    // Product 1: Standard Visiting Cards
    const prodCards = await Product.create({
      name: 'Standard Visiting Cards (300 GSM Matte)',
      slug: 'visiting-cards',
      category: createdCategories['business-printing']._id,
      shortDescription: 'Professional 300/350 GSM cards with crisp color printing and lamination options.',
      description: 'Elevate your professional impression with crisp, vibrant print quality on high-grade cardstock. Available in standard and classic dimensions with optional spot UV accents.',
      images: ['https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80'],
      basePrice: 500,
      isFeatured: true,
      isDemoData: false,
      artworkRequirements: {
        allowedFormats: ['PDF', 'PNG', 'JPG', 'AI'],
        minDpi: 300,
        requiresManualReview: true,
        safeZoneMm: 3,
        bleedMm: 3,
      },
    });

    await ProductAttributeSchema.create({
      product: prodCards._id,
      attributes: [
        {
          key: 'size',
          label: 'Card Size',
          type: 'select',
          required: true,
          options: [
            { value: '89x51mm', label: '89 × 51 mm (Standard)', priceModifier: 0 },
            { value: '90x54mm', label: '90 × 54 mm (Classic)', priceModifier: 20 },
          ],
        },
        {
          key: 'paper',
          label: 'Paper Stock',
          type: 'select',
          required: true,
          options: [
            { value: '300gsm-matte', label: '300 GSM Matte Cardstock', priceModifier: 0 },
            { value: '350gsm-gloss', label: '350 GSM Premium Glossy', priceModifier: 50 },
          ],
        },
        {
          key: 'finish',
          label: 'Lamination / Finish',
          type: 'select',
          required: true,
          options: [
            { value: 'standard', label: 'Standard Smooth Finish', priceModifier: 0 },
            { value: 'uv-spot', label: 'Spot UV Accent Lamination', priceModifier: 100 },
          ],
        },
      ],
      quantityTiers: [100, 250, 500, 1000],
    });

    await PricingRule.create({
      product: prodCards._id,
      basePrice: 500,
      quantityBreaks: [
        { minQty: 100, pricePerUnit: 5 },
        { minQty: 250, pricePerUnit: 4.5 },
        { minQty: 500, pricePerUnit: 4 },
        { minQty: 1000, pricePerUnit: 3.5 },
      ],
      attributeModifiers: [
        { attributeKey: 'size', optionValue: '90x54mm', priceModifier: 20, modifierType: 'FLAT' },
        { attributeKey: 'paper', optionValue: '350gsm-gloss', priceModifier: 50, modifierType: 'FLAT' },
        { attributeKey: 'finish', optionValue: 'uv-spot', priceModifier: 100, modifierType: 'FLAT' },
      ],
      isDemoData: false,
    });

    // Product 2: Custom Outdoor Flex Banners
    const prodBanners = await Product.create({
      name: 'Custom Outdoor Flex Banners',
      slug: 'flex-banners',
      category: createdCategories['signage-banners']._id,
      shortDescription: 'Weather-resistant outdoor flex banners with custom dimensions and eyelets.',
      description: 'Durable weather-resistant banners with reinforced eyelets for secure mounting in outdoor advertising. Custom dimensions available from 1ft to 50ft.',
      images: ['https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80'],
      basePrice: 200,
      isFeatured: true,
      isDemoData: false,
      artworkRequirements: {
        allowedFormats: ['PDF', 'PNG', 'JPG', 'AI', 'PSD'],
        minDpi: 150,
        requiresManualReview: true,
        safeZoneMm: 10,
        bleedMm: 10,
      },
    });

    await ProductAttributeSchema.create({
      product: prodBanners._id,
      attributes: [
        {
          key: 'dimensions',
          label: 'Custom Size (Width × Height in ft)',
          type: 'numeric-range',
          required: true,
          minRange: 1,
          maxRange: 50,
          unit: 'ft',
          options: [
            { value: 'custom', label: 'Enter Dimensions', requiresInput: ['width', 'height'] },
          ],
        },
        {
          key: 'material',
          label: 'Banner Material',
          type: 'select',
          required: true,
          options: [
            { value: 'standard-flex', label: '340 GSM Standard Flex', priceModifier: 0 },
            { value: 'star-flex', label: '440 GSM Premium Star Flex', priceModifier: 15 },
          ],
        },
        {
          key: 'eyelets',
          label: 'Mounting Eyelets',
          type: 'select',
          required: true,
          options: [
            { value: 'all-four-corners', label: 'All 4 Corners Only', priceModifier: 0 },
            { value: 'every-2-feet', label: 'Heavy Duty: Every 2 Feet', priceModifier: 50 },
          ],
        },
      ],
      quantityTiers: [1, 5, 10, 25],
    });

    await PricingRule.create({
      product: prodBanners._id,
      basePrice: 200,
      quantityBreaks: [
        { minQty: 1, pricePerUnit: 20 },
        { minQty: 5, pricePerUnit: 18 },
        { minQty: 10, pricePerUnit: 15 },
        { minQty: 25, pricePerUnit: 12 },
      ],
      attributeModifiers: [
        { attributeKey: 'material', optionValue: 'star-flex', priceModifier: 15, modifierType: 'PER_SQ_FT' },
        { attributeKey: 'eyelets', optionValue: 'every-2-feet', priceModifier: 50, modifierType: 'FLAT' },
      ],
      isDemoData: false,
    });

    // Product 3: Personalized Cotton T-Shirts
    const prodTshirts = await Product.create({
      name: 'Personalized 100% Cotton T-Shirts',
      slug: 't-shirts',
      category: createdCategories['custom-apparel']._id,
      shortDescription: '100% combed cotton custom printed tees for corporate branding and teams.',
      description: 'Comfortable, durable custom apparel ideal for company events, team outings, and promotional branding. Features high-definition wash-resistant printing.',
      images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80'],
      basePrice: 350,
      isFeatured: true,
      isDemoData: false,
      artworkRequirements: {
        allowedFormats: ['PDF', 'PNG', 'AI', 'PSD'],
        minDpi: 300,
        requiresManualReview: true,
        safeZoneMm: 5,
        bleedMm: 5,
      },
    });

    await ProductAttributeSchema.create({
      product: prodTshirts._id,
      attributes: [
        {
          key: 'size',
          label: 'Apparel Size',
          type: 'select',
          required: true,
          options: [
            { value: 'S', label: 'Small (S)', priceModifier: 0 },
            { value: 'M', label: 'Medium (M)', priceModifier: 0 },
            { value: 'L', label: 'Large (L)', priceModifier: 0 },
            { value: 'XL', label: 'Extra Large (XL)', priceModifier: 20 },
            { value: 'XXL', label: 'Double Extra Large (XXL)', priceModifier: 40 },
          ],
        },
        {
          key: 'color',
          label: 'Fabric Color',
          type: 'swatch',
          required: true,
          options: [
            { value: 'white', label: 'Classic White', image: '#FFFFFF', priceModifier: 0 },
            { value: 'navy-blue', label: 'Navy Blue', image: '#000080', priceModifier: 20 },
            { value: 'charcoal', label: 'Charcoal Black', image: '#373435', priceModifier: 20 },
          ],
        },
        {
          key: 'printLocation',
          label: 'Printing Location',
          type: 'select',
          required: true,
          options: [
            { value: 'front-only', label: 'Front Chest Only', priceModifier: 0 },
            { value: 'front-and-back', label: 'Front & Back Print', priceModifier: 80 },
          ],
        },
      ],
      quantityTiers: [1, 5, 10, 25, 50, 100],
    });

    await PricingRule.create({
      product: prodTshirts._id,
      basePrice: 350,
      quantityBreaks: [
        { minQty: 1, pricePerUnit: 350 },
        { minQty: 5, pricePerUnit: 330 },
        { minQty: 10, pricePerUnit: 300 },
        { minQty: 25, pricePerUnit: 280 },
        { minQty: 50, pricePerUnit: 250 },
        { minQty: 100, pricePerUnit: 220 },
      ],
      attributeModifiers: [
        { attributeKey: 'size', optionValue: 'XL', priceModifier: 20, modifierType: 'FLAT' },
        { attributeKey: 'size', optionValue: 'XXL', priceModifier: 40, modifierType: 'FLAT' },
        { attributeKey: 'color', optionValue: 'navy-blue', priceModifier: 20, modifierType: 'FLAT' },
        { attributeKey: 'color', optionValue: 'charcoal', priceModifier: 20, modifierType: 'FLAT' },
        { attributeKey: 'printLocation', optionValue: 'front-and-back', priceModifier: 80, modifierType: 'FLAT' },
      ],
      isDemoData: false,
    });

    // Product 4: Executive PVC ID Cards
    const prodIdCards = await Product.create({
      name: 'Executive PVC Employee ID Cards',
      slug: 'pvc-id-cards',
      category: createdCategories['business-printing']._id,
      shortDescription: 'Durable 30-mil PVC ID cards with high-definition thermal printing.',
      description: 'Standard credit-card size (86 × 54 mm) PVC badges resistant to water and bending. Perfect for corporate employees, event passes, and school identity cards.',
      images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'],
      basePrice: 150,
      isFeatured: true,
      isDemoData: false,
      artworkRequirements: {
        allowedFormats: ['PDF', 'PNG', 'AI', 'PSD'],
        minDpi: 300,
        requiresManualReview: true,
        safeZoneMm: 2,
        bleedMm: 2,
      },
    });

    await ProductAttributeSchema.create({
      product: prodIdCards._id,
      attributes: [
        {
          key: 'orientation',
          label: 'Card Orientation',
          type: 'select',
          required: true,
          options: [
            { value: 'vertical', label: 'Vertical (Portrait)', priceModifier: 0 },
            { value: 'horizontal', label: 'Horizontal (Landscape)', priceModifier: 0 },
          ],
        },
        {
          key: 'finish',
          label: 'Surface Finish',
          type: 'select',
          required: true,
          options: [
            { value: 'glossy', label: 'Standard Glossy PVC', priceModifier: 0 },
            { value: 'matte', label: 'Anti-Glare Matte PVC', priceModifier: 15 },
          ],
        },
      ],
      quantityTiers: [10, 25, 50, 100, 250],
    });

    await PricingRule.create({
      product: prodIdCards._id,
      basePrice: 150,
      quantityBreaks: [
        { minQty: 10, pricePerUnit: 45 },
        { minQty: 25, pricePerUnit: 40 },
        { minQty: 50, pricePerUnit: 35 },
        { minQty: 100, pricePerUnit: 30 },
        { minQty: 250, pricePerUnit: 25 },
      ],
      attributeModifiers: [
        { attributeKey: 'finish', optionValue: 'matte', priceModifier: 15, modifierType: 'FLAT' },
      ],
      isDemoData: false,
    });

    // Product 5: Corporate Letterheads
    const prodLetterheads = await Product.create({
      name: 'Executive Corporate Letterheads (A4)',
      slug: 'corporate-letterheads',
      category: createdCategories['stationery']._id,
      shortDescription: '100 GSM Alabaster paper letterheads for official business correspondence.',
      description: 'Make official letters and invoices stand out with premium 100 GSM bond paper letterheads. Laser-printer compatible and smudge-free.',
      images: ['https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80'],
      basePrice: 800,
      isFeatured: false,
      isDemoData: false,
      artworkRequirements: {
        allowedFormats: ['PDF', 'AI'],
        minDpi: 300,
        requiresManualReview: true,
        safeZoneMm: 5,
        bleedMm: 3,
      },
    });

    await ProductAttributeSchema.create({
      product: prodLetterheads._id,
      attributes: [
        {
          key: 'paperType',
          label: 'Paper Stock',
          type: 'select',
          required: true,
          options: [
            { value: '100gsm-bond', label: '100 GSM Premium Bond', priceModifier: 0 },
            { value: '120gsm-textured', label: '120 GSM Royal Textured', priceModifier: 200 },
          ],
        },
      ],
      quantityTiers: [100, 250, 500, 1000],
    });

    await PricingRule.create({
      product: prodLetterheads._id,
      basePrice: 800,
      quantityBreaks: [
        { minQty: 100, pricePerUnit: 8 },
        { minQty: 250, pricePerUnit: 6.5 },
        { minQty: 500, pricePerUnit: 5.5 },
        { minQty: 1000, pricePerUnit: 4.5 },
      ],
      attributeModifiers: [
        { attributeKey: 'paperType', optionValue: '120gsm-textured', priceModifier: 200, modifierType: 'FLAT' },
      ],
      isDemoData: false,
    });

    // Product 6: Roll-Up Standee
    const prodStandee = await Product.create({
      name: 'Aluminum Roll-Up Exhibition Standee',
      slug: 'roll-up-standee',
      category: createdCategories['signage-banners']._id,
      shortDescription: '6x2.5 ft retractable roll-up standee with durable aluminum stand and carry bag.',
      description: 'Quick-setup retractable standee printed on tear-resistant non-curl star flex or PET film. Essential for trade shows, retail entrances, and corporate presentations.',
      images: ['https://images.unsplash.com/photo-1542744094-3a3e2203538c?auto=format&fit=crop&w=600&q=80'],
      basePrice: 1200,
      isFeatured: false,
      isDemoData: false,
      artworkRequirements: {
        allowedFormats: ['PDF', 'AI', 'PSD'],
        minDpi: 150,
        requiresManualReview: true,
        safeZoneMm: 10,
        bleedMm: 10,
      },
    });

    await ProductAttributeSchema.create({
      product: prodStandee._id,
      attributes: [
        {
          key: 'filmType',
          label: 'Media Film Type',
          type: 'select',
          required: true,
          options: [
            { value: 'star-flex', label: '330 GSM Star Flex Banner', priceModifier: 0 },
            { value: 'pet-greyback', label: 'Premium Non-Curl PET Film', priceModifier: 350 },
          ],
        },
      ],
      quantityTiers: [1, 2, 5, 10],
    });

    await PricingRule.create({
      product: prodStandee._id,
      basePrice: 1200,
      quantityBreaks: [
        { minQty: 1, pricePerUnit: 1200 },
        { minQty: 2, pricePerUnit: 1100 },
        { minQty: 5, pricePerUnit: 1000 },
        { minQty: 10, pricePerUnit: 900 },
      ],
      attributeModifiers: [
        { attributeKey: 'filmType', optionValue: 'pet-greyback', priceModifier: 350, modifierType: 'FLAT' },
      ],
      isDemoData: false,
    });

    console.log('Products, attribute schemas, and pricing rules seeded successfully.');

    // 4. Seed Ready-Made Templates for Configurator Customization
    await Template.create({
      product: prodCards._id,
      name: 'Modern Executive Minimal Template',
      thumbnail: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=400&q=80',
      previewFront: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=600&q=80',
      editableFields: [
        { key: 'company_name', label: 'Company Name', type: 'TEXT', defaultValue: 'Maaza Printwala' },
        { key: 'person_name', label: 'Full Name', type: 'TEXT', defaultValue: 'Rajesh Sharma' },
        { key: 'designation', label: 'Job Title', type: 'TEXT', defaultValue: 'Marketing Director' },
        { key: 'phone', label: 'Contact Phone', type: 'TEXT', defaultValue: '+91 98765 43210' },
      ],
      isActive: true,
      isDemoData: false,
    });

    await Template.create({
      product: prodTshirts._id,
      name: 'Team Celebration & Event Edition',
      thumbnail: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80',
      previewFront: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
      editableFields: [
        { key: 'team_name', label: 'Team / Event Name', type: 'TEXT', defaultValue: 'Superstars Annual Meet 2026' },
        { key: 'tagline', label: 'Custom Tagline', type: 'TEXT', defaultValue: '#IndiaKiApniOnlinePress' },
      ],
      isActive: true,
      isDemoData: false,
    });

    console.log('Templates seeded successfully.');

    // 5. Seed Production Delivery Rules
    await DeliveryRule.create([
      {
        name: 'Standard Pan-India Delivery (5-7 Business Days)',
        pinCodePrefixes: ['*'],
        deliveryMethod: 'STANDARD',
        charge: 99,
        freeDeliveryThreshold: 1500,
        estimatedDaysMin: 5,
        estimatedDaysMax: 7,
        isActive: true,
        isDemoData: false,
      },
      {
        name: 'Express Metro Delivery (2-3 Business Days)',
        pinCodePrefixes: ['400', '110', '560', '600', '700'],
        deliveryMethod: 'EXPRESS',
        charge: 199,
        freeDeliveryThreshold: 3000,
        estimatedDaysMin: 2,
        estimatedDaysMax: 3,
        isActive: true,
        isDemoData: false,
      },
      {
        name: 'Same-Day Priority Print Express (Mumbai Zone)',
        pinCodePrefixes: ['400'],
        deliveryMethod: 'SAME_DAY',
        charge: 299,
        freeDeliveryThreshold: 5000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 1,
        isActive: true,
        isDemoData: false,
      },
    ]);
    console.log('Production Delivery Rules seeded successfully.');

    // 6. Seed CMS Content
    await CMSContent.create({
      key: 'homepage_hero',
      section: 'HERO',
      title: 'India ki Apni Online Printing Press',
      content: {
        subtitle: 'Premium custom commercial printing with transparent volume pricing, staff pre-press quality checks, and reliable nationwide delivery.',
        ctaText: 'Explore Print Catalogue',
        ctaLink: '/products',
        badgeText: '#IndiaKiApniPress',
      },
      isDemoData: false,
    });

    await CMSContent.create({
      key: 'policy_shipping',
      section: 'POLICY',
      title: 'Shipping & Delivery Policy',
      content: {
        text: 'All commercial orders undergo pre-press artwork verification prior to production. Standard orders are dispatched within 24 to 48 hours of artwork approval. Nationwide standard shipping takes 5-7 business days via reliable courier partners. Express metro delivery reaches major cities within 2-3 business days. Free standard shipping applies automatically on orders above ₹1,500.',
      },
      isDemoData: false,
    });

    console.log('CMS content seeded successfully.');
    console.log('Seeding completed! Production catalogue is now active.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
