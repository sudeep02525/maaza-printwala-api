const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maaza_printwala';

mongoose.connect(MONGODB_URI)
.then(async () => {
  console.log('Connected to DB');
  
  const db = mongoose.connection.db;
  const categories = await db.collection('categories').find({}).toArray();
  categories.forEach(c => console.log(`Category: ${c.name}, Slug: ${c.slug}`));
  
  mongoose.disconnect();
})
.catch(err => {
  console.error(err);
  process.exit(1);
});
