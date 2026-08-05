const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const Product = require('./src/models/Product.js').default || require('./src/models/Product.js');
    const Category = require('./src/models/Category.js').default || require('./src/models/Category.js');

    const visitingCardsCategory = await Category.findOne({ slug: 'visiting-cards' });
    if (!visitingCardsCategory) {
      console.log('Visiting cards category not found');
      process.exit(0);
    }

    let updatedCount = 0;
    
    // Loop through subcategory groups
    for (const group of visitingCardsCategory.subcategoryGroups) {
      for (const item of group.items) {
        // Find matching product
        const product = await Product.findOne({ slug: item.slug });
        if (product && product.images && product.images.length > 0) {
          item.image = product.images[0];
          updatedCount++;
          console.log(`Matched image for subcategory: ${item.name} -> ${item.image}`);
        } else {
          console.log(`No product found or no image for subcategory: ${item.name} (slug: ${item.slug})`);
        }
      }
    }

    if (updatedCount > 0) {
      await visitingCardsCategory.save();
      console.log(`Successfully updated images for ${updatedCount} subcategories!`);
    } else {
      console.log('No subcategory images were updated.');
    }

  } catch (error) {
    console.error('Error updating subcategory images:', error);
  } finally {
    process.exit(0);
  }
}).catch(console.error);
