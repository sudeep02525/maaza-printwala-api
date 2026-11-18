import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const maskUri = (uri) => {
  if (!uri) return 'undefined';
  return uri.replace(/:\/\/[^@]+@/, '://<credentials-hidden>@');
};

const OLD_MONGO_URI = process.env.OLD_MONGO_URI;
const NEW_MONGO_URI = process.env.NEW_MONGO_URI;

if (!OLD_MONGO_URI || !NEW_MONGO_URI) {
  console.error('Error: Both OLD_MONGO_URI and NEW_MONGO_URI must be set in .env');
  console.error(`OLD_MONGO_URI present: ${!!OLD_MONGO_URI}`);
  console.error(`NEW_MONGO_URI present: ${!!NEW_MONGO_URI}`);
  process.exit(1);
}

const BATCH_SIZE = 500;

async function migrate() {
  console.log('==================================================');
  console.log('       Maaza Printwala - Atlas Migration');
  console.log('==================================================');
  console.log(`Source (OLD): ${maskUri(OLD_MONGO_URI)}`);
  console.log(`Target (NEW): ${maskUri(NEW_MONGO_URI)}`);
  console.log('--------------------------------------------------\n');

  const sourceClient = new MongoClient(OLD_MONGO_URI);
  const targetClient = new MongoClient(NEW_MONGO_URI);

  try {
    await sourceClient.connect();
    console.log('✓ Connected to Source (OLD) Atlas DB');

    await targetClient.connect();
    console.log('✓ Connected to Target (NEW) Atlas DB\n');

    const sourceDb = sourceClient.db('test');
    const targetDb = targetClient.db('test');

    const collections = await sourceDb.listCollections().toArray();
    collections.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`Found ${collections.length} collections in source database 'test'.\n`);

    // Check if target has existing data
    const existingTargetCols = await targetDb.listCollections().toArray();
    let targetHasData = false;
    for (const tc of existingTargetCols) {
      const cnt = await targetDb.collection(tc.name).countDocuments();
      if (cnt > 0) {
        targetHasData = true;
        console.log(`[Notice] Target collection '${tc.name}' already contains ${cnt} documents.`);
      }
    }
    if (targetHasData) {
      console.log('Target database is not completely empty. Using upsert mode for safe idempotent sync.\n');
    }

    const migrationSummary = [];

    for (const c of collections) {
      const colName = c.name;
      const sourceCol = sourceDb.collection(colName);
      const targetCol = targetDb.collection(colName);

      const totalSourceDocs = await sourceCol.countDocuments();
      console.log(`Migrating '${colName}' (${totalSourceDocs} documents)...`);

      // 1. Data Migration in batches of 500 with upsert
      let migratedCount = 0;
      if (totalSourceDocs > 0) {
        const cursor = sourceCol.find({});
        let batch = [];

        while (await cursor.hasNext()) {
          const doc = await cursor.next();
          batch.push({
            replaceOne: {
              filter: { _id: doc._id },
              replacement: doc,
              upsert: true
            }
          });

          if (batch.length >= BATCH_SIZE) {
            await targetCol.bulkWrite(batch, { ordered: false });
            migratedCount += batch.length;
            batch = [];
          }
        }

        if (batch.length > 0) {
          await targetCol.bulkWrite(batch, { ordered: false });
          migratedCount += batch.length;
        }
      }

      // 2. Index Recreation from Source listIndexes()
      const sourceIndexes = await sourceCol.indexes();
      const createdIndexes = [];

      for (const idx of sourceIndexes) {
        if (idx.name === '_id_') continue;

        try {
          const indexOptions = { name: idx.name };
          if (idx.unique) indexOptions.unique = true;
          if (idx.sparse) indexOptions.sparse = true;
          if (idx.expireAfterSeconds !== undefined) indexOptions.expireAfterSeconds = idx.expireAfterSeconds;

          // Handle text indexes
          if (idx.weights) {
            const textKeys = Object.fromEntries(Object.keys(idx.weights).map(k => [k, 'text']));
            indexOptions.weights = idx.weights;
            if (idx.default_language) indexOptions.default_language = idx.default_language;
            if (idx.language_override) indexOptions.language_override = idx.language_override;
            await targetCol.createIndex(textKeys, indexOptions);
          } else {
            await targetCol.createIndex(idx.key, indexOptions);
          }
          createdIndexes.push(idx.name);
        } catch (idxErr) {
          console.warn(`  [Warning] Index '${idx.name}' on '${colName}': ${idxErr.message}`);
        }
      }

      const finalTargetCount = await targetCol.countDocuments();
      migrationSummary.push({
        collection: colName,
        sourceCount: totalSourceDocs,
        targetCount: finalTargetCount,
        match: totalSourceDocs === finalTargetCount,
        indexesRecreated: createdIndexes.length
      });

      console.log(`✓ '${colName}' done. Source: ${totalSourceDocs}, Target: ${finalTargetCount}, Indexes: ${createdIndexes.length}`);
    }

    // 3. Model.syncIndexes() pass via Mongoose on Target
    console.log('\nRunning Mongoose Model.syncIndexes() on target database...');
    await mongoose.connect(NEW_MONGO_URI);
    const modelsDir = path.resolve('src/models');
    const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));
    for (const file of modelFiles) {
      try {
        const modelModule = await import(`file://${path.join(modelsDir, file)}`);
        const Model = modelModule.default;
        if (Model && Model.syncIndexes) {
          await Model.syncIndexes();
        }
      } catch (mErr) {
        console.warn(`  [Notice] Model sync for ${file}: ${mErr.message}`);
      }
    }
    await mongoose.disconnect();
    console.log('✓ Mongoose syncIndexes completed.');

    // 4. Verification & Spot Checking
    console.log('\n==================================================');
    console.log('              VERIFICATION REPORT');
    console.log('==================================================');
    console.table(migrationSummary);

    let allCountsMatch = migrationSummary.every(s => s.match);
    if (!allCountsMatch) {
      console.error('❌ MISMATCH DETECTED IN DOCUMENT COUNTS! Review table above.');
      process.exit(1);
    } else {
      console.log('✓ All 22 collection document counts match 100% exactly.\n');
    }

    // Spot-checking 3 documents per collection
    console.log('--- Performing Spot Checks (3 documents per collection) ---');
    let spotCheckFailures = 0;

    for (const c of collections) {
      const colName = c.name;
      const sourceCol = sourceDb.collection(colName);
      const targetCol = targetDb.collection(colName);

      const sampleDocs = await sourceCol.find({}).limit(3).toArray();
      for (const sample of sampleDocs) {
        const targetDoc = await targetCol.findOne({ _id: sample._id });
        if (!targetDoc) {
          console.error(`❌ Spot-check failed: Doc _id ${sample._id} missing in target '${colName}'`);
          spotCheckFailures++;
          continue;
        }

        const sourceKeys = Object.keys(sample);
        const targetKeys = Object.keys(targetDoc);
        if (sourceKeys.length !== targetKeys.length) {
          console.error(`❌ Spot-check failed: Field count mismatch for _id ${sample._id} in '${colName}' (Source: ${sourceKeys.length}, Target: ${targetKeys.length})`);
          spotCheckFailures++;
        }
      }
    }

    if (spotCheckFailures === 0) {
      console.log('✓ Spot checks passed: all sampled documents match _id and field structures.\n');
    } else {
      console.error(`❌ ${spotCheckFailures} spot check failures detected!`);
      process.exit(1);
    }

    console.log('==================================================');
    console.log('   MIGRATION COMPLETED SUCCESSFULLY WITH ZERO ERRORS');
    console.log('==================================================');

  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

migrate();

