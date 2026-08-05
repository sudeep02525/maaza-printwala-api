import mongoose from 'mongoose';
import 'dotenv/config';
import Category from '../src/models/Category.js';

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
          { name: 'Premium Cards', slug: 'premium-cards', image: '/images/subcategories/visiting_cards.png' }
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
    image: '/images/banner_business_cards.png',
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
    image: '/images/banner_business_cards.png',
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
          { name: 'Paper Bags', slug: 'paper-bags', image: 'https://images.unsplash.com/photo-1550171633-9f8fc3227d8f?auto=format&fit=crop&w=400&q=80' }
        ]
      },
      {
        name: 'Boxes',
        items: [
          { name: 'Gift Boxes', slug: 'gift-boxes', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80' },
          { name: 'Shipping Boxes', slug: 'shipping-boxes', image: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=400&q=80' }
        ]
      }
    ]
  },
  {
    name: 'Labels & Stickers',
    slug: 'labels-stickers',
    description: 'Custom labels and stickers for all your packaging and branding needs.',
    image: '/images/banner_business_cards.png',
    sortOrder: 5,
    subcategoryGroups: [
      {
        name: 'Stickers',
        items: [
          { name: 'Die-Cut Stickers', slug: 'die-cut-stickers', image: 'https://images.unsplash.com/photo-1605371924599-2d0365da26f5?auto=format&fit=crop&w=400&q=80' }
        ]
      },
      {
        name: 'Labels',
        items: [
          { name: 'Product Labels', slug: 'product-labels', image: 'https://images.unsplash.com/photo-1582214309485-667746401062?auto=format&fit=crop&w=400&q=80' }
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
          { name: 'Hoodies', slug: 'hoodies', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80' }
        ]
      },
      {
        name: 'Headwear',
        items: [
          { name: 'Caps', slug: 'caps', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80' }
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
          { name: 'Water Bottles', slug: 'water-bottles', image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=400&q=80' }
        ]
      },
      {
        name: 'Tech',
        items: [
          { name: 'Pen Drives', slug: 'pen-drives', image: 'https://images.unsplash.com/photo-1602280206263-1d0c41071239?auto=format&fit=crop&w=400&q=80' }
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

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maaza_printwala');
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    for (const catData of categoryData) {
      const category = new Category(catData);
      await category.save();
      console.log(`Saved category: ${category.name}`);
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedCategories();
