/**
 * STEP 03 - Rewrite image paths in MongoDB
 *
 * Walks the documents and replaces any stored local image path with the
 * Cloudinary URL from manifest.cloudinary.json.
 *
 * "/images/products/a.png" -> https://res.cloudinary.com/.../a.png
 * "http://localhost:5000/images/products/a.png" -> same Cloudinary URL
 *
 * Dry run by default. Nothing is written until you pass --apply.
 */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MAP_FILE = path.resolve(__dirname, 'manifest.cloudinary.json');
const DEFAULT_COLLECTIONS = [
  'products',
  'categories',
  'templates',
  'cmscontents',
  'users',
  'reviews',
  'designprojects',
  'settings',
  'deliveryrules',
];

const arg = (name, fallback = null) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};

const flag = (name) => process.argv.includes(`--${name}`);
const APPLY = flag('apply');
const ALL = flag('all');
const COLLECTIONS = arg('collections')
  ? arg('collections').split(',').map((s) => s.trim())
  : ALL
  ? null
  : DEFAULT_COLLECTIONS;

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not set.');
  process.exit(1);
}

if (!fs.existsSync(MAP_FILE)) {
  console.error(`Missing ${MAP_FILE}. Run upload step first.`);
  process.exit(1);
}

const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));

// exact path -> url
const exact = new Map();
// basename -> url (catches "http://localhost:5000/images/x.png", "?v=2" suffixes, etc.)
const byBase = new Map();

for (const [key, value] of Object.entries(map)) {
  if (!value || !value.url) continue;
  exact.set(key, value.url);
  const base = path.posix.basename(key.split('?')[0]);
  if (!byBase.has(base)) byBase.set(base, value.url);
}

console.log(`mapping entries: ${exact.size}`);

const resolve = (value) => {
  if (typeof value !== 'string') return null;
  if (value.startsWith('https://res.cloudinary.com')) return null; // already migrated
  if (!value.includes('/images/')) return null;
  if (exact.has(value)) return exact.get(value);
  const clean = value.split('?')[0].split('#')[0];
  if (exact.has(clean)) return exact.get(clean);
  const base = path.posix.basename(clean);
  if (byBase.has(base)) return byBase.get(base);
  return null;
};

/** Returns a list of [dottedPath, newValue] for one document. */
const collectChanges = (doc) => {
  const changes = [];
  const walk = (node, prefix) => {
    if (Array.isArray(node)) {
      node.forEach((child, i) => {
        const next = `${prefix}.${i}`;
        const replaced = resolve(child);
        if (replaced) changes.push([next, replaced]);
        else if (child && typeof child === 'object') walk(child, next);
      });
      return;
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (k === '_id') continue;
        const next = prefix ? `${prefix}.${k}` : k;
        const replaced = resolve(v);
        if (replaced) changes.push([next, replaced]);
        else if (v && typeof v === 'object') walk(v, next);
      }
    }
  };
  walk(doc, '');
  return changes;
};

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
console.log(`connected: ${db.databaseName}`);
console.log(APPLY ? 'MODE: APPLY (writing)' : 'MODE: DRY RUN (nothing is written)');
console.log('');

const collections = COLLECTIONS || (await db.listCollections().toArray()).map((c) => c.name);
const summary = [];

for (const name of collections) {
  const exists = await db.listCollections({ name }).hasNext();
  if (!exists) {
    console.log(`- ${name}: not present, skipped`);
    continue;
  }
  const coll = db.collection(name);
  const cursor = coll.find({});
  let scanned = 0;
  let changed = 0;
  const samples = [];
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    scanned += 1;
    const changes = collectChanges(doc);
    if (changes.length === 0) continue;
    changed += 1;
    if (samples.length < 3) samples.push({ id: String(doc._id), changes: changes.slice(0, 2) });
    if (APPLY) {
      const $set = {};
      for (const [p, v] of changes) $set[p] = v;
      await coll.updateOne({ _id: doc._id }, { $set });
    }
  }
  summary.push({ collection: name, scanned, changed });
  console.log(`- ${name}: ${scanned} scanned, ${changed} document(s) ${APPLY ? 'updated' : 'would change'}`);
  for (const s of samples) {
    console.log(`   ${s.id}`);
    for (const [p, v] of s.changes) console.log(`     ${p} -> ${v}`);
  }
}

console.log('');
console.table(summary);
console.log(APPLY ? 'Done. Now run code rewrite step.' : 'Nothing written. Re-run with --apply.');

await mongoose.disconnect();
