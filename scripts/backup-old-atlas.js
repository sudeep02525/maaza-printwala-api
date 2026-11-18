import { MongoClient, BSON } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const OLD_MONGO_URI = process.env.OLD_MONGO_URI || process.env.MONGO_URI;

if (!OLD_MONGO_URI) {
  console.error('Error: OLD_MONGO_URI is not set in environment.');
  process.exit(1);
}

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve('backups', `old-atlas-backup-${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`Starting backup of OLD database into: ${backupDir}`);
  const client = new MongoClient(OLD_MONGO_URI);

  try {
    await client.connect();
    const db = client.db('test');
    const collections = await db.listCollections().toArray();

    let totalDocs = 0;
    let totalSizeBytes = 0;

    for (const c of collections) {
      const col = db.collection(c.name);
      const docs = await col.find({}).toArray();
      const indexes = await col.indexes();

      const outData = {
        collection: c.name,
        exportedAt: new Date().toISOString(),
        count: docs.length,
        indexes,
        data: docs
      };

      const filePath = path.join(backupDir, `${c.name}.json`);
      const jsonContent = BSON.EJSON.stringify(outData, null, 2);
      await fs.promises.writeFile(filePath, jsonContent, 'utf-8');

      const stats = await fs.promises.stat(filePath);
      totalDocs += docs.length;
      totalSizeBytes += stats.size;

      console.log(`Backed up '${c.name}': ${docs.length} docs (${(stats.size / 1024).toFixed(2)} KB)`);
    }

    console.log('\n--- Backup Summary ---');
    console.log(`Destination: ${backupDir}`);
    console.log(`Collections: ${collections.length}`);
    console.log(`Total Documents: ${totalDocs}`);
    console.log(`Total Size: ${(totalSizeBytes / 1024).toFixed(2)} KB`);
  } catch (err) {
    console.error('Backup failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

backup();

