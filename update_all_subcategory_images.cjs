const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const Product = require('./src/models/Product.js').default || require('./src/models/Product.js');
    const Category = require('./src/models/Category.js').default || require('./src/models/Category.js');

    const categories = await Category.find({});
    let totalUpdated = 0;

    for (const category of categories) {
      let updatedCount = 0;
      for (const group of category.subcategoryGroups) {
        for (const item of group.items) {
          // If image is missing, try to find a matching product
          if (!item.image) {
            const product = await Product.findOne({ slug: item.slug });
            if (product && product.images && product.images.length > 0) {
              item.image = product.images[0];
              updatedCount++;
            }
          }
        }
      }
      if (updatedCount > 0) {
        await category.save();
        totalUpdated += updatedCount;
        console.log(`Updated ${updatedCount} subcategories for ${category.name}`);
      }
    }

    console.log(`Successfully updated total ${totalUpdated} subcategories!`);
  } catch (error) {
    console.error('Error updating subcategory images:', error);
  } finally {
    process.exit(0);
  }
}).catch(console.error);
