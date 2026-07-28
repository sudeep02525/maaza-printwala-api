import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { ENV } from '../config/env.js';
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
    await mongoose.connect(ENV.MONGO_URI);
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
    const catBiz = await Category.create({
      name: 'Business Cards & ID',
      slug: 'business-cards',
      description: 'Professional visiting cards, corporate letterheads, and PVC employee ID cards.',
      isActive: true,
      sortOrder: 1,
    });

    const subCatBiz = await Category.create({
      name: 'Standard Visiting Cards',
      slug: 'standard-visiting-cards',
      description: 'Classic rectangular visiting cards for every business professional.',
      parentId: catBiz._id,
      isActive: true,
      sortOrder: 1,
    });

    const subCatId = await Category.create({
      name: 'PVC ID Cards & Lanyards',
      slug: 'pvc-id-cards',
      description: 'Durable contactless PVC employee identity cards with custom branded lanyards.',
      parentId: catBiz._id,
      isActive: true,
      sortOrder: 2,
    });

    const catSignage = await Category.create({
      name: 'Marketing & Outdoor Signage',
      slug: 'marketing-signage',
      description: 'High-impact outdoor flex banners, roll-up standees, and store displays.',
      isActive: true,
      sortOrder: 2,
    });

    const subCatSignage = await Category.create({
      name: 'Flex Banners',
      slug: 'flex-banners',
      description: 'Custom sized durable outdoor flex banners with metal eyelets.',
      parentId: catSignage._id,
      isActive: true,
      sortOrder: 1,
    });

    const subCatStandee = await Category.create({
      name: 'Roll-Up Standees',
      slug: 'roll-up-standees',
      description: 'Portable aluminum roll-up standees ideal for exhibitions and trade shows.',
      parentId: catSignage._id,
      isActive: true,
      sortOrder: 2,
    });

    const catApparel = await Category.create({
      name: 'Custom Apparel & Gifts',
      slug: 'custom-apparel',
      description: 'Personalized cotton t-shirts, corporate clothing, and ceramic mugs.',
      isActive: true,
      sortOrder: 3,
    });

    const subCatApparel = await Category.create({
      name: 'Cotton T-Shirts',
      slug: 't-shirts',
      description: 'Comfortable combed cotton tees with vibrant direct-to-garment custom printing.',
      parentId: catApparel._id,
      isActive: true,
      sortOrder: 1,
    });

    const subCatMugs = await Category.create({
      name: 'Ceramic Photo Mugs',
      slug: 'ceramic-mugs',
      description: 'Premium grade sublimation printed ceramic mugs for corporate gifting.',
      parentId: catApparel._id,
      isActive: true,
      sortOrder: 2,
    });

    const catMarketing = await Category.create({
      name: 'Flyers & Brochures',
      slug: 'flyers-brochures',
      description: 'Promotional leaflets, bi-fold brochures, and custom product stickers.',
      isActive: true,
      sortOrder: 4,
    });

    const subCatFlyers = await Category.create({
      name: 'Promotional Flyers',
      slug: 'promotional-flyers',
      description: 'High-speed bulk flyer printing on glossy and matte art paper.',
      parentId: catMarketing._id,
      isActive: true,
      sortOrder: 1,
    });

    console.log('Categories seeded successfully.');

    // 3. Seed Production Catalogue Products
    // Product 1: Standard Visiting Cards
    const prodCards = await Product.create({
      name: 'Standard Visiting Cards (300 GSM Matte)',
      slug: 'visiting-cards',
      category: subCatBiz._id,
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
      category: subCatSignage._id,
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
      category: subCatApparel._id,
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
      category: subCatId._id,
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
      category: subCatBiz._id,
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
      category: subCatStandee._id,
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
