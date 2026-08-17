import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/maaza_printwala').then(async () => {
  const db = mongoose.connection.db;
  const result = await db.collection('products').updateOne(
    { name: /Executive PVC Employee ID Cards/i },
    { $set: { images: ['/images/subcategories/pvc_cards.png'] } }
  );
  console.log('Update result:', result);
  process.exit(0);
});
