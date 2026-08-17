require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGO_URI;

mongoose.connect(MONGODB_URI)
.then(async () => {
  console.log('Connected to DB');
  
  // Update Category slug
  const db = mongoose.connection.db;
  const result = await db.collection('categories').updateOne(
    { slug: 'business-printing' },
    { $set: { slug: 'visiting-cards' } }
  );
  
  console.log(`Matched ${result.matchedCount} document(s) and modified ${result.modifiedCount} document(s) in categories.`);
  
  mongoose.disconnect();
})
.catch(err => {
  console.error(err);
  process.exit(1);
});
