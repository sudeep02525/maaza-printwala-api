const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Product = require('./src/models/Product.js').default || require('./src/models/Product.js');
  const destDir = 'C:\\maaza-printwala\\maaza-printwala-web\\public\\images\\products';
  const files = fs.readdirSync(destDir);
  
  const getImg = (prefix) => {
    const matching = files.filter(f => f.startsWith(prefix) && f.endsWith('.png'));
    return matching.length === 0 ? null : matching[0];
  };
  
  const mapping = {
    'standard-visiting-cards': getImg('v2_standard'),
    'classic-visiting-cards': getImg('v2_standard'),
    'rounded-corner-visiting-cards': getImg('v2_rounded'),
    'square-visiting-cards': getImg('v2_standard'),
    'leaf-visiting-cards': getImg('v2_velvet'),
    'oval-visiting-cards': getImg('v2_rounded'),
    'circle-visiting-cards': getImg('v2_rounded'),
    'custom-shape-visiting-cards': getImg('v2_velvet'),
    'spot-uv-visiting-cards': getImg('v2_spot_uv'),
    'raised-foil-visiting-cards': getImg('v2_spot_uv'),
    'glossy-visiting-cards': getImg('v2_glossy'),
    'matte-visiting-cards': getImg('v2_matte'),
    'bulk-visiting-cards': getImg('v2_standard'),
    'magnetic-visiting-cards': getImg('v2_premium'),
    'transparent-visiting-cards': getImg('v2_glossy'),
    'premium-plus-visiting-cards': getImg('v2_premium'),
    'non-tearable-visiting-cards': getImg('v2_matte'),
    'velvet-touch-visiting-cards': getImg('v2_velvet'),
    'pearl-visiting-cards': getImg('v2_premium'),
    'kraft-visiting-cards': getImg('v2_qrcode'),
    'diamond-visiting-cards': getImg('v2_premium'),
    'qr-code-visiting-cards': getImg('v2_qrcode')
  };
  
  for (const [slug, imgFile] of Object.entries(mapping)) {
    if (imgFile) {
      await Product.findOneAndUpdate({ slug: slug }, { $set: { images: ['/images/products/' + imgFile] } });
      console.log('Updated ' + slug);
    }
  }
  process.exit(0);
});
