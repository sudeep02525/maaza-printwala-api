const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/maaza_printwala').then(async () => {
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({ name: /Executive PVC/i }).toArray();
  console.log(JSON.stringify(products, null, 2));
  process.exit(0);
});
