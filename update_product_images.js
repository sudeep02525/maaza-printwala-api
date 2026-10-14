import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const cardSlots2to6 = [
  '/images/products/cards_angle_view.jpg',
  '/images/products/cards_texture_closeup.jpg',
  '/images/products/cards_lifestyle_desk.jpg',
  '/images/products/cards_boxed_packaging.jpg',
  '/images/products/cards_gallery_sample.jpg',
];

const heroMap = {
  'standard-card': '/images/products/v2_standard_card_1785948339354.png',
  'visiting-cards': '/images/products/v2_standard_card_1785948339354.png',
  'standard-visiting-cards': '/images/products/v2_standard_card_1785948339354.png',
  'classic-visiting-cards': '/images/products/standard_visiting_card_1785947757902.png',
  'glossy-card': '/images/products/v2_glossy_card_1785948351752.png',
  'glossy-visiting-cards': '/images/products/v2_glossy_card_1785948351752.png',
  'matte-card': '/images/products/v2_matte_card_1785948364553.png',
  'matte-visiting-cards': '/images/products/v2_matte_card_1785948364553.png',
  'spot-uv-card': '/images/products/v2_spot_uv_card_1785948375368.png',
  'spot-uv-visiting-cards': '/images/products/v2_spot_uv_card_1785948375368.png',
  'rounded-card': '/images/products/v2_rounded_card_1785948386413.png',
  'rounded-visiting-cards': '/images/products/v2_rounded_card_1785948386413.png',
  'rounded-corner-visiting-cards': '/images/products/v2_rounded_card_1785948386413.png',
  'velvet-card': '/images/products/v2_velvet_card_1785948471723.png',
  'velvet-touch-visiting-cards': '/images/products/v2_velvet_card_1785948471723.png',
  'qrcode-card': '/images/products/hero_qr_code_card.jpg',
  'qr-code-visiting-cards': '/images/products/hero_qr_code_card.jpg',
  'pearl-visiting-cards': '/images/products/hero_pearl_card.jpg',
  'premium-card': '/images/products/v2_premium_card_1785948535781.png',
  'premium-plus-visiting-cards': '/images/products/v2_premium_card_1785948535781.png',
  'transparent-visiting-card': '/images/products/transparent_visiting_card_1785947767352.png',
  'transparent-visiting-cards': '/images/products/transparent_visiting_card_1785947767352.png',
  'square-visiting-card': '/images/products/square_visiting_card_1785947789963.png',
  'square-visiting-cards': '/images/products/square_visiting_card_1785947789963.png',
  'rounded-visiting-card': '/images/products/rounded_visiting_card_1785947777870.png',
  'magnetic-visiting-card': '/images/products/magnetic_visiting_card_1785947801266.png',
  'magnetic-visiting-cards': '/images/products/magnetic_visiting_card_1785947801266.png',
  'kraft-visiting-card': '/images/products/hero_kraft_card.jpg',
  'kraft-visiting-cards': '/images/products/hero_kraft_card.jpg',
  'diamond-visiting-card': '/images/products/diamond_visiting_card.png',
  'diamond-visiting-cards': '/images/products/diamond_visiting_card.png',
};

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const Product = (await import('./src/models/Product.js')).default;

    const allProducts = await Product.find({});
    console.log(`Found ${allProducts.length} products to update`);

    for (const prod of allProducts) {
      let newImages = [];
      const slug = prod.slug;

      if (heroMap[slug]) {
        newImages = [heroMap[slug], ...cardSlots2to6];
      } else if (slug.includes('card') || (prod.category?.name && prod.category.name.includes('Visiting'))) {
        const existingHero = (prod.images && prod.images[0]) || '/images/products/v2_standard_card_1785948339354.png';
        newImages = [existingHero, ...cardSlots2to6];
      } else if (slug === 'roll-up-standee') {
        newImages = [
          '/images/products/standee_lifestyle_event.jpg',
          '/images/products/flex_banner_outdoor.jpg',
          '/images/products/cards_boxed_packaging.jpg'
        ];
      } else if (slug === 'corporate-letterheads') {
        newImages = [
          '/images/executive_letterhead.png',
          '/images/products/letterhead_angle_pack.jpg',
          '/images/products/cards_texture_closeup.jpg',
          '/images/products/cards_lifestyle_desk.jpg'
        ];
      } else if (slug === 'pvc-id-cards') {
        newImages = [
          '/images/subcategories/pvc_cards.png',
          '/images/products/pvc_id_lifestyle.jpg',
          '/images/products/cards_boxed_packaging.jpg',
          '/images/products/cards_lifestyle_desk.jpg'
        ];
      } else if (slug === 't-shirts') {
        newImages = [
          '/images/cotton_tshirt.png',
          '/images/products/tshirt_lifestyle.jpg',
          '/images/cat_tshirt_new_1785478181285.png',
          '/images/products/cards_boxed_packaging.jpg'
        ];
      } else if (slug === 'flex-banners') {
        newImages = [
          '/images/outdoor_banner.png',
          '/images/products/flex_banner_outdoor.jpg',
          '/images/products/standee_lifestyle_event.jpg'
        ];
      } else {
        const existingHero = (prod.images && prod.images[0]) || '/images/products/v2_standard_card_1785948339354.png';
        newImages = [existingHero, ...cardSlots2to6];
      }

      await Product.updateOne({ _id: prod._id }, { $set: { images: newImages } });
      console.log(`Updated ${prod.name} (${prod.slug}): ${newImages.length} images`);
    }

    console.log('All product images updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Update error:', err);
    process.exit(1);
  }
}

run();
