import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';
import Category from './src/models/Category.js';

dotenv.config();

// Intelligent keyword expander
function generateRichKeywords(productName, categoryName) {
  const keywords = new Set();
  const pName = productName.toLowerCase().trim();
  const cName = categoryName ? categoryName.toLowerCase().trim() : '';

  // 1. Direct keywords
  keywords.add(pName);
  if (cName) keywords.add(cName);

  // Helper to add multiple phrases
  const addPhrases = (phrases) => phrases.forEach(p => keywords.add(p));

  // 2. Specific matching based on product characteristics
  if (pName.includes('visiting card') || cName.includes('visiting card')) {
     addPhrases([
       'visiting card', 'visiting cards', 'business card', 'business cards',
       'name card', 'custom visiting card', 'premium visiting card',
       'professional visiting card', 'personal visiting card', 'office visiting card',
       'company visiting card', 'corporate visiting card', 'printed visiting card',
       'visiting card printing', 'business card printing', 'custom business card',
       'corporate business card', 'employee visiting card', 'contact card', 'contact cards',
       'company card', 'office card', 'professional card', 'custom card', 'cards'
     ]);
  }
  
  if (pName.includes('shirt') || pName.includes('apparel') || cName.includes('apparel')) {
     addPhrases([
       'custom t shirt', 'custom tshirt', 'custom tshirts', 'printed t shirt',
       'printed tshirt', 'personalized t shirt', 'personalised t shirt', 'custom printed shirt',
       'printed shirt', 'shirt printing', 't shirt printing', 'tshirt printing',
       'custom apparel', 'personalized clothing', 'custom clothing', 'logo t shirt',
       'company t shirt', 'business t shirt', 'event t shirt', 'team t shirt',
       'shirt', 'tshirt', 't-shirt', 'apparel'
     ]);
  }
  
  if (pName.includes('flyer') || cName.includes('flyer')) {
     addPhrases([
       'flyer', 'flyers', 'custom flyer', 'business flyer', 'event flyer',
       'marketing flyer', 'flyer printing', 'printed flyers', 'pamphlet',
       'brochure', 'promotional flyer', 'handbill', 'leaflet', 'leaflets',
       'custom pamphlets', 'company flyer', 'advertising flyer', 'advertising material'
     ]);
  }

  if (pName.includes('banner') || cName.includes('banner')) {
     addPhrases([
       'banner', 'banners', 'custom banner', 'business banner', 'event banner',
       'banner printing', 'printed banners', 'large banner', 'flex banner',
       'flex printing', 'vinyl banner', 'standee', 'outdoor banner', 'promotional banner',
       'signage', 'advertising banner'
     ]);
  }

  if (pName.includes('sticker') || pName.includes('label') || cName.includes('sticker') || cName.includes('label')) {
     addPhrases([
       'sticker', 'stickers', 'label', 'labels', 'custom sticker', 'custom label',
       'product label', 'packaging label', 'logo sticker', 'die cut sticker',
       'die cut stickers', 'sticker printing', 'label printing', 'printed stickers',
       'printed labels', 'adhesive labels', 'vinyl stickers', 'waterproof stickers'
     ]);
  }

  if (pName.includes('mug') || pName.includes('cup')) {
     addPhrases([
       'mug', 'mugs', 'coffee mug', 'coffee cup', 'custom mug', 'custom coffee mug',
       'personalized mug', 'printed mug', 'mug printing', 'photo mug',
       'corporate mug', 'gift mug', 'company mug', 'logo mug'
     ]);
  }

  if (pName.includes('letterhead') || cName.includes('stationery')) {
     addPhrases([
       'letterhead', 'letterheads', 'custom letterhead', 'company letterhead',
       'business letterhead', 'office letterhead', 'letterhead printing',
       'printed letterhead', 'corporate stationery', 'office stationery',
       'business stationery', 'custom stationery'
     ]);
  }

  if (pName.includes('packaging') || pName.includes('box')) {
     addPhrases([
       'packaging', 'box', 'boxes', 'custom box', 'custom packaging',
       'product box', 'printed box', 'shipping box', 'mailer box',
       'corrugated box', 'packaging printing', 'custom boxes', 'brand packaging'
     ]);
  }

  // 3. Remove common extraneous words to create generic terms
  let baseName = pName
     .replace(/\b(premium|standard|custom|printed|cotton|embroidered|glossy|matte|classic|rounded corner|leaf|square|transparent|die-cut|folded|kraft|diamond|vinyl|flex)\b/g, '')
     .replace(/\b(300gsm|350gsm|400gsm|plastic|pvc|metal|wooden)\b/g, '')
     .replace(/\s+/g, ' ')
     .trim();

  if (baseName && baseName.length > 2) {
     keywords.add(baseName);
     if (baseName.endsWith('s')) {
        keywords.add(baseName.slice(0, -1)); 
     } else {
        keywords.add(baseName + 's'); 
     }
  }

  // Ensure no random typos remain. Clean up invalid keywords (like vistng, visihng, crd)
  const invalidKeywords = ['vistng', 'visihng', 'crd', 'visitng', 'matt', 'mate', 'tshrt', 'teeshirt', 'bussines'];
  invalidKeywords.forEach(invalid => keywords.delete(invalid));

  return Array.from(keywords).filter(k => k.length >= 3);
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const products = await Product.find({ isActive: true }).populate('category');
    
    let processedCount = 0;
    let updatedCount = 0;
    let productsWithNoKeywords = 0;
    let keywordCounts = [];
    let examples = [];

    for (const p of products) {
       processedCount++;
       
       // Preserve existing meaningful keywords (filter out typos)
       const existingValid = (p.keywords || []).filter(k => 
         k.length >= 3 && !['vistng', 'visihng', 'crd', 'visitng', 'matt', 'mate', 'tshrt', 'teeshirt', 'bussines'].includes(k)
       );
       
       const generated = generateRichKeywords(p.name, p.category?.name);
       
       // Combine and remove duplicates
       const finalKeywords = Array.from(new Set([...existingValid, ...generated]));
       
       if (finalKeywords.length === 0) productsWithNoKeywords++;
       keywordCounts.push(finalKeywords.length);
       
       await Product.updateOne(
          { _id: p._id },
          { $set: { keywords: finalKeywords } }
       );
       updatedCount++;
       
       if (examples.length < 5) {
          examples.push({
             name: p.name,
             keywords: finalKeywords
          });
       }
    }
    
    // Stats
    const totalKeywords = keywordCounts.reduce((a, b) => a + b, 0);
    const avg = (totalKeywords / processedCount).toFixed(1);
    const min = Math.min(...keywordCounts);
    const max = Math.max(...keywordCounts);

    console.log("--- KEYWORD GENERATION REPORT ---");
    console.log(`Total active products: ${products.length}`);
    console.log(`Products processed: ${processedCount}`);
    console.log(`Products successfully updated: ${updatedCount}`);
    console.log(`Products with no keywords: ${productsWithNoKeywords}`);
    console.log(`Average keywords per product: ${avg}`);
    console.log(`Minimum keywords: ${min}`);
    console.log(`Maximum keywords: ${max}`);
    console.log("\n--- REAL EXAMPLES ---");
    examples.forEach((ex, i) => {
       console.log(`${i+1}. ${ex.name}`);
       console.log(`   -> ${ex.keywords.join(', ')}`);
       console.log("");
    });
    
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}
run();
