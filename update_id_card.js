import mongoose from 'mongoose';
mongoose.connect('mongodb://sudeepdas2525_db_user:ePrPTZQm1aEir5kg@ac-pakhgfm-shard-00-00.8msshac.mongodb.net:27017,ac-pakhgfm-shard-00-01.8msshac.mongodb.net:27017,ac-pakhgfm-shard-00-02.8msshac.mongodb.net:27017/?ssl=true&replicaSet=atlas-kawcl7-shard-0&authSource=admin&appName=Cluster0').then(async () => {
  const db = mongoose.connection.db;
  const result = await db.collection('products').updateOne(
    { name: /Executive PVC Employee ID Cards/i },
    { $set: { images: ['/images/subcategories/pvc_cards.png'] } }
  );
  console.log('Update result:', result);
  process.exit(0);
});
