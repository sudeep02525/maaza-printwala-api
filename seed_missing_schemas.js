import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const createSchemas = async () => {
  try {
    const { connectDB } = await import('./src/config/db.js');
    await connectDB();
    await import('./src/models/Category.js');
    const Product = (await import('./src/models/Product.js')).default;
    const Schema = (await import('./src/models/ProductAttributeSchema.js')).default;

    const products = await Product.find({ isActive: true }).lean();

    for (const prod of products) {
      const existing = await Schema.findOne({ product: prod._id });
      if (existing) continue;

      const name = prod.name;
      let attributes = [];
      let quantityTiers = [100, 250, 500, 1000];

      if (name.includes('Visiting Card')) {
        let paperStock = [
          { value: '300gsm-matte', label: '300 GSM Matte Cardstock', priceModifier: 0 },
          { value: '350gsm-gloss', label: '350 GSM Premium Glossy', priceModifier: 50 },
        ];
        let finish = [
          { value: 'standard', label: 'Standard Smooth Finish', priceModifier: 0 },
          { value: 'matte', label: 'Matte Lamination', priceModifier: 30 },
        ];
        let size = [
          { value: '89x51mm', label: '89 × 51 mm (Standard)', priceModifier: 0 },
          { value: '90x54mm', label: '90 × 54 mm (Classic)', priceModifier: 20 },
        ];

        if (name.includes('Spot UV')) {
          finish = [
            { value: 'spot-uv', label: 'Spot UV Accent Lamination', priceModifier: 80 },
            { value: 'standard', label: 'Standard Smooth Finish', priceModifier: 0 },
          ];
          paperStock = [{ value: '350gsm-velvet', label: '350 GSM Velvet Touch Stock', priceModifier: 0 }];
        } else if (name.includes('Raised Foil')) {
          finish = [
            { value: 'foil-gold', label: 'Metallic Foil Stamping', priceModifier: 120 },
            { value: 'spot-uv', label: 'Spot UV Accent Lamination', priceModifier: 80 },
          ];
          paperStock = [{ value: '400gsm-super', label: '400 GSM Super Heavy Cardstock', priceModifier: 50 }];
        } else if (name.includes('Glossy')) {
          finish = [{ value: 'glossy', label: 'High-Gloss Mirror Lamination', priceModifier: 0 }];
          paperStock = [{ value: '350gsm-gloss', label: '350 GSM Premium Glossy', priceModifier: 0 }];
        } else if (name.includes('Matte')) {
          finish = [{ value: 'matte', label: 'Anti-Glare Matte Lamination', priceModifier: 0 }];
          paperStock = [{ value: '350gsm-matte', label: '350 GSM Matte Cardstock', priceModifier: 0 }];
        } else if (name.includes('Velvet')) {
          finish = [{ value: 'velvet', label: 'Velvet Touch Soft Feel Lamination', priceModifier: 50 }];
          paperStock = [{ value: '400gsm-velvet', label: '400 GSM Soft-Touch Cardstock', priceModifier: 0 }];
        } else if (name.includes('Pearl')) {
          finish = [{ value: 'pearl', label: 'Shimmer Metallic Finish', priceModifier: 60 }];
          paperStock = [{ value: '300gsm-pearl', label: '300 GSM Pearl Shimmer Metallic Stock', priceModifier: 0 }];
        } else if (name.includes('Kraft')) {
          finish = [{ value: 'natural', label: 'Natural Raw Texture', priceModifier: 0 }];
          paperStock = [{ value: '350gsm-kraft', label: '350 GSM Recycled Kraft Paper Stock', priceModifier: 0 }];
        } else if (name.includes('Diamond')) {
          finish = [{ value: 'diamond', label: 'Diamond Texture Lamination', priceModifier: 60 }];
          paperStock = [{ value: '400gsm-diamond', label: '400 GSM Diamond Glitter Cardstock', priceModifier: 0 }];
        } else if (name.includes('Magnetic')) {
          finish = [{ value: 'glossy', label: 'Glossy Lamination', priceModifier: 0 }];
          paperStock = [{ value: 'magnetic-sheet', label: '0.5mm Flexible Magnetic Sheet', priceModifier: 0 }];
        } else if (name.includes('Transparent') || name.includes('Non-Tearable')) {
          finish = [{ value: 'matte-pvc', label: 'Frosted Matte PVC', priceModifier: 0 }];
          paperStock = [{ value: 'pvc-sheet', label: '250 Micron Frosted Translucent PVC', priceModifier: 0 }];
        } else if (name.includes('QR Code')) {
          finish = [
            { value: 'spot-gloss', label: 'Spot UV QR Code Accent', priceModifier: 40 },
            { value: 'matte', label: 'Anti-Glare Matte Lamination', priceModifier: 0 },
          ];
        } else if (name.includes('Square')) {
          size = [{ value: 'square', label: 'Square (65 × 65 mm)', priceModifier: 20 }];
        } else if (name.includes('Rounded')) {
          size = [{ value: 'rounded', label: 'Rounded Corners (89 × 51 mm)', priceModifier: 15 }];
        } else if (name.includes('Leaf') || name.includes('Oval') || name.includes('Circle') || name.includes('Custom Shape')) {
          size = [{ value: 'die-cut', label: 'Custom Die-Cut Shape', priceModifier: 40 }];
        }

        attributes = [
          { key: 'size', label: 'Card Size', type: 'select', required: true, options: size },
          { key: 'paper', label: 'Material / Paper Stock', type: 'select', required: true, options: paperStock },
          { key: 'finish', label: 'Lamination / Finish', type: 'select', required: true, options: finish },
        ];
      } else if (name.includes('T-Shirt') || name.includes('Shirt') || name.includes('Polo')) {
        quantityTiers = [1, 5, 10, 25, 50];
        attributes = [
          {
            key: 'size',
            label: 'Size',
            type: 'select',
            required: true,
            options: [
              { value: 'S', label: 'Small (S)', priceModifier: 0 },
              { value: 'M', label: 'Medium (M)', priceModifier: 0 },
              { value: 'L', label: 'Large (L)', priceModifier: 0 },
              { value: 'XL', label: 'Extra Large (XL)', priceModifier: 30 },
              { value: 'XXL', label: 'Double Extra Large (XXL)', priceModifier: 50 },
            ],
          },
          {
            key: 'material',
            label: 'Material',
            type: 'select',
            required: true,
            options: [
              { value: 'cotton-180', label: '100% Combed Bio-Washed Cotton', priceModifier: 0 },
              { value: 'pique-220', label: '220 GSM Cotton Pique Knit', priceModifier: 50 },
            ],
          },
          {
            key: 'color',
            label: 'Color',
            type: 'select',
            required: true,
            options: [
              { value: 'white', label: 'Classic White', priceModifier: 0 },
              { value: 'navy', label: 'Navy Blue', priceModifier: 20 },
              { value: 'black', label: 'Charcoal Black', priceModifier: 20 },
            ],
          },
        ];
      } else if (name.includes('Mug') || name.includes('Welcome Kit')) {
        quantityTiers = [1, 5, 10, 50, 100];
        attributes = [
          {
            key: 'material',
            label: 'Material',
            type: 'select',
            required: true,
            options: [
              { value: 'ceramic-grade-a', label: 'Grade-A Ceramic (11 oz)', priceModifier: 0 },
              { value: 'hardboard-kit', label: 'Premium Rigid Gift Box', priceModifier: 0 },
            ],
          },
          {
            key: 'finish',
            label: 'Finish',
            type: 'select',
            required: true,
            options: [
              { value: 'glossy-glaze', label: 'High-Gloss Glaze', priceModifier: 0 },
              { value: 'matte-gold', label: 'Matte Lamination with Gold Foil', priceModifier: 50 },
            ],
          },
        ];
      } else if (name.includes('Boxes')) {
        quantityTiers = [50, 100, 250, 500];
        attributes = [
          {
            key: 'material',
            label: 'Material',
            type: 'select',
            required: true,
            options: [
              { value: 'kraft-3ply', label: '3-Ply Kraft Corrugated Board', priceModifier: 0 },
              { value: 'kraft-5ply', label: 'Heavy Duty 5-Ply Board', priceModifier: 25 },
            ],
          },
          {
            key: 'finish',
            label: 'Finish',
            type: 'select',
            required: true,
            options: [
              { value: 'natural-kraft', label: 'Natural Raw Texture', priceModifier: 0 },
              { value: 'matte-lam', label: 'Anti-Glare Matte Lamination', priceModifier: 15 },
            ],
          },
        ];
      } else if (name.includes('Letterhead')) {
        quantityTiers = [100, 250, 500, 1000];
        attributes = [
          {
            key: 'paper',
            label: 'Paper Stock',
            type: 'select',
            required: true,
            options: [
              { value: '100gsm-bond', label: '100 GSM Executive Bond Paper', priceModifier: 0 },
              { value: '120gsm-royal', label: '120 GSM Royal Textured Paper', priceModifier: 40 },
            ],
          },
          {
            key: 'finish',
            label: 'Finish',
            type: 'select',
            required: true,
            options: [
              { value: 'natural-smooth', label: 'Standard Smooth Finish', priceModifier: 0 },
            ],
          },
        ];
      } else if (name.includes('Flyer') || name.includes('Brochure')) {
        quantityTiers = [250, 500, 1000, 2500];
        attributes = [
          {
            key: 'paper',
            label: 'Paper Stock',
            type: 'select',
            required: true,
            options: [
              { value: '130gsm-art', label: '130 GSM Gloss Art Paper', priceModifier: 0 },
              { value: '170gsm-art', label: '170 GSM Premium Art Paper', priceModifier: 35 },
            ],
          },
          {
            key: 'finish',
            label: 'Finish',
            type: 'select',
            required: true,
            options: [
              { value: 'gloss', label: 'High-Gloss Mirror Lamination', priceModifier: 0 },
              { value: 'matte', label: 'Anti-Glare Matte Lamination', priceModifier: 20 },
            ],
          },
        ];
      } else if (name.includes('Sticker') || name.includes('Label')) {
        quantityTiers = [50, 100, 250, 500];
        attributes = [
          {
            key: 'material',
            label: 'Material',
            type: 'select',
            required: true,
            options: [
              { value: 'vinyl-white', label: 'Waterproof White Vinyl', priceModifier: 0 },
              { value: 'clear-vinyl', label: 'Clear Transparent Vinyl', priceModifier: 20 },
            ],
          },
          {
            key: 'finish',
            label: 'Finish',
            type: 'select',
            required: true,
            options: [
              { value: 'gloss', label: 'High-Gloss Mirror Lamination', priceModifier: 0 },
              { value: 'matte', label: 'Anti-Glare Matte Lamination', priceModifier: 15 },
            ],
          },
        ];
      } else {
        // Fallback default
        attributes = [
          {
            key: 'paper',
            label: 'Paper Stock',
            type: 'select',
            required: true,
            options: [
              { value: 'standard-stock', label: '300 GSM Matte Cardstock', priceModifier: 0 },
              { value: 'premium-stock', label: '350 GSM Premium Glossy', priceModifier: 30 },
            ],
          },
          {
            key: 'finish',
            label: 'Finish',
            type: 'select',
            required: true,
            options: [
              { value: 'standard', label: 'Standard Smooth Finish', priceModifier: 0 },
              { value: 'matte', label: 'Anti-Glare Matte Lamination', priceModifier: 20 },
            ],
          },
        ];
      }

      await Schema.create({
        product: prod._id,
        attributes,
        quantityTiers,
      });

      console.log(`Created schema for: ${name}`);
    }

    console.log('Finished creating all missing schemas.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

createSchemas();
