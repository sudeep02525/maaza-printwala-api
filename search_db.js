import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/maaza-printwala';

async function searchDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    const collections = await db.collections();
    
    for (const col of collections) {
      const items = await col.find({ 
        $or: [
          { name: { $regex: /diamond|kraft/i } },
          { "subcategoryGroups.items.name": { $regex: /diamond|kraft/i } }
        ]
      }).toArray();
      
      if (items.length > 0) {
        console.log(`Found in collection: ${col.collectionName}`);
        for (const item of items) {
          console.log(`  - Name/Title: ${item.name || item.title || item._id}`);
          if (item.subcategoryGroups) {
            for (const group of item.subcategoryGroups) {
               if (group.items) {
                 for (const sub of group.items) {
                   if (sub.name && (sub.name.toLowerCase().includes('diamond') || sub.name.toLowerCase().includes('kraft'))) {
                      console.log(`    -> SubItem: ${sub.name} (slug: ${sub.slug}) (image: ${sub.image})`);
                   }
                 }
               }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
searchDB();
