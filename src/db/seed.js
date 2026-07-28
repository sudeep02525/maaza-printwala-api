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
    console.log('Connected to MongoDB for seeding...');

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

    // 1. Seed Users (Admin & Demo User)
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const userPassword = await bcrypt.hash('user123', salt);

    const adminUser = await User.create({
      name: 'Maaza Admin',
      email: 'admin@maazaprintwala.demo',
      password: adminPassword,
      role: ROLES.ADMIN,
      phone: '+919876543210',
    });

    const demoUser = await User.create({
      name: 'Demo Customer',
      email: 'user@maazaprintwala.demo',
      password: userPassword,
      role: ROLES.USER,
      phone: '+919123456780',
    });

    console.log('Users seeded successfully.');

    // 2. Seed Categories (Dynamic structure reference)
    const catBiz = await Category.create({
      name: 'Business Cards',
      slug: 'business-cards',
      description: 'Professional visiting cards with premium finish options.',
      isActive: true,
      sortOrder: 1,
    });

    const subCatBiz = await Category.create({
      name: 'Standard Visiting Cards',
      slug: 'standard-visiting-cards',
      description: 'Classic rectangular visiting cards for every business.',
      parentId: catBiz._id,
      isActive: true,
      sortOrder: 1,
    });

    const catSignage = await Category.create({
      name: 'Marketing & Signage',
      slug: 'marketing-signage',
      description: 'High-impact outdoor and indoor advertising banners.',
      isActive: true,
      sortOrder: 2,
    });

    const subCatSignage = await Category.create({
      name: 'Flex Banners',
      slug: 'flex-banners',
      description: 'Custom sized durable outdoor flex banners.',
      parentId: catSignage._id,
      isActive: true,
      sortOrder: 1,
    });

    const catApparel = await Category.create({
      name: 'Custom Apparel',
      slug: 'custom-apparel',
      description: 'Personalized t-shirts and corporate clothing.',
      isActive: true,
      sortOrder: 3,
    });

    const subCatApparel = await Category.create({
      name: 'T-Shirts',
      slug: 't-shirts',
      description: 'Comfortable cotton tees with custom printing.',
      parentId: catApparel._id,
      isActive: true,
      sortOrder: 1,
    });

    console.log('Categories seeded successfully.');

    // 3. Seed Three Structurally Diverse Validation Products (Demo Data Only)
    // Product 1: Visiting Cards (Fixed sizes, select options)
    const prodCards = await Product.create({
      name: 'Standard Visiting Cards (Demo)',
      slug: 'visiting-cards-demo',
      category: subCatBiz._id,
      shortDescription: 'Professional 300/350 GSM cards. [Development Demo Data]',
      description: 'Elevate your professional impression with crisp, vibrant print quality. Note: All pricing and specifications are development placeholders.',
      images: ['https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80'],
      basePrice: 500,
      isFeatured: true,
      isDemoData: true,
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
      isDemoData: true,
    });

    // Product 2: Banners (Numeric custom range dimensions)
    const prodBanners = await Product.create({
      name: 'Custom Flex Banners (Demo)',
      slug: 'flex-banners-demo',
      category: subCatSignage._id,
      shortDescription: 'Weather-resistant outdoor flex banners. [Development Demo Data]',
      description: 'Durable banners with eyelets for secure mounting. Custom dimensions available. Note: All pricing is demo placeholder data.',
      images: ['https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80'],
      basePrice: 200,
      isFeatured: true,
      isDemoData: true,
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
      isDemoData: true,
    });

    // Product 3: T-Shirts (Swatches and sizes)
    const prodTshirts = await Product.create({
      name: 'Personalized Cotton T-Shirts (Demo)',
      slug: 't-shirts-demo',
      category: subCatApparel._id,
      shortDescription: '100% combed cotton custom printed tees. [Development Demo Data]',
      description: 'Ideal for company events, team outings, and branding. Note: All pricing is demo placeholder data.',
      images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80'],
      basePrice: 350,
      isFeatured: true,
      isDemoData: true,
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
      isDemoData: true,
    });

    console.log('Products, attribute schemas, and pricing rules seeded successfully.');

    // 4. Seed Templates for Experience B (Select & Customise Predefined Templates)
    await Template.create({
      product: prodCards._id,
      name: 'Modern Corporate Minimal (Demo Template)',
      thumbnail: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=400&q=80',
      previewFront: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=600&q=80',
      editableFields: [
        { key: 'company_name', label: 'Company Name', type: 'TEXT', defaultValue: 'Maaza Demo Printwala' },
        { key: 'person_name', label: 'Full Name', type: 'TEXT', defaultValue: 'Rajesh Sharma' },
        { key: 'designation', label: 'Job Title', type: 'TEXT', defaultValue: 'Marketing Director' },
        { key: 'phone', label: 'Contact Phone', type: 'TEXT', defaultValue: '+91 98765 43210' },
      ],
      isActive: true,
      isDemoData: true,
    });

    await Template.create({
      product: prodTshirts._id,
      name: 'Team Celebration Edition (Demo Template)',
      thumbnail: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80',
      previewFront: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
      editableFields: [
        { key: 'team_name', label: 'Team / Event Name', type: 'TEXT', defaultValue: 'Superstars Annual Meet 2026' },
        { key: 'tagline', label: 'Custom Tagline', type: 'TEXT', defaultValue: '#IndiaKiApniOnlinePress' },
      ],
      isActive: true,
      isDemoData: true,
    });

    console.log('Templates seeded successfully.');

    // 5. Seed Demo Delivery Rules (Development Fixtures Only)
    await DeliveryRule.create([
      {
        name: 'Standard Pan-India Delivery [DEMO RULE]',
        pinCodePrefixes: ['*'],
        deliveryMethod: 'STANDARD',
        charge: 99,
        freeDeliveryThreshold: 1500,
        estimatedDaysMin: 5,
        estimatedDaysMax: 7,
        isActive: true,
        isDemoData: true,
      },
      {
        name: 'Express Metro Delivery [DEMO RULE]',
        pinCodePrefixes: ['400', '110', '560', '600', '700'],
        deliveryMethod: 'EXPRESS',
        charge: 199,
        freeDeliveryThreshold: 3000,
        estimatedDaysMin: 2,
        estimatedDaysMax: 3,
        isActive: true,
        isDemoData: true,
      },
      {
        name: 'Same-Day Print Express [DEMO RULE]',
        pinCodePrefixes: ['400'],
        deliveryMethod: 'SAME_DAY',
        charge: 299,
        freeDeliveryThreshold: 5000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 1,
        isActive: true,
        isDemoData: true,
      },
    ]);
    console.log('Demo Delivery Rules seeded successfully.');

    // 6. Seed CMS Content (Hero, FAQ, Policy placeholders)
    await CMSContent.create({
      key: 'homepage_hero',
      section: 'HERO',
      title: 'India ki Apni Online Printing Press',
      content: {
        subtitle: 'Premium custom printing with transparent pricing and reliable nationwide delivery. [Demo Environment]',
        ctaText: 'Explore Demo Catalogue',
        ctaLink: '/products',
        badgeText: '#IndiaKiApniPress',
      },
      isDemoData: true,
    });

    await CMSContent.create({
      key: 'policy_shipping',
      section: 'POLICY',
      title: 'Shipping Policy (Demo Placeholder)',
      content: {
        text: 'This is a development placeholder for the Maaza Printwala Shipping Policy. Actual delivery zones, timelines, and courier rules will be configured by the administration team prior to production go-live.',
      },
      isDemoData: true,
    });

    console.log('CMS content seeded successfully.');
    console.log('Seeding completed! You can now test the API.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
