/**
 * STEP 05 - Verify
 *
 * Three checks:
 * 1. no local image paths left in the database
 * 2. no hardcoded '/images/...' literals left in the frontend source
 * 3. every Cloudinary URL in the manifest answers HTTP 200
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
const CODE_EXT = new Set(['.js', '.jsx', '.ts', '.tsx']);
const CONCURRENCY = 5;

const arg = (name, fallback = null) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};

const flag = (name) => process.argv.includes(`--${name}`);
const SKIP_HTTP = flag('skip-http');

const defaultRoots = [
  path.resolve(__dirname, '../../maaza-printwala-web/src'),
  path.resolve(__dirname, '../../maaza-printwala-admin/src'),
];

const SOURCE_ROOTS = (arg('roots') || '')
  ? arg('roots').split(',').map((s) => path.resolve(s.trim())).filter((p) => fs.existsSync(p))
  : defaultRoots.filter((p) => fs.existsSync(p));

if (!fs.existsSync(MAP_FILE)) {
  console.error(`Missing ${MAP_FILE}.`);
  process.exit(1);
}

const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
const urls = [...new Set(Object.values(map).map((v) => v && v.url).filter(Boolean))];

let problems = 0;

// ---------- 1. database ----------
if (process.env.MONGO_URI) {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const names = (await db.listCollections().toArray()).map((c) => c.name);
  let localRefs = 0;
  for (const name of names) {
    const coll = db.collection(name);
    const count = await coll.countDocuments({
      $or: [
        { images: { $elemMatch: { $regex: '^/images/' } } },
        { image: { $regex: '^/images/' } },
        { previewFront: { $regex: '^/images/' } },
        { thumbnail: { $regex: '^/images/' } },
      ],
    });
    if (count > 0) {
      localRefs += count;
      console.log(`DB ${name}: ${count} document(s) still point at /images/`);
    }
  }
  if (localRefs === 0) console.log('DB ok - no local image paths left');
  else problems += localRefs;
  await mongoose.disconnect();
} else {
  console.log('DB skipped - MONGO_URI not set');
}

// ---------- 2. source code ----------
const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
      walk(full, out);
    } else if (CODE_EXT.has(path.extname(entry.name))) out.push(full);
  }
  return out;
};

let codeHits = 0;
for (const root of SOURCE_ROOTS) {
  for (const file of walk(root)) {
    if (path.basename(file) === 'getImageUrl.js') continue;
    const text = fs.readFileSync(file, 'utf8');
    const matches = text.match(/['"`]\/images\/[^'"`]+['"`]/g) || [];
    if (matches.length) {
      codeHits += matches.length;
      console.log(`SRC ${path.relative(process.cwd(), file)}: ${matches.length} local path(s)`);
      for (const m of matches.slice(0, 3)) console.log(`   ${m}`);
    }
  }
}
if (codeHits === 0) console.log('SRC ok - no hardcoded /images/ literals left');
else problems += codeHits;

// ---------- 3. HTTP ----------
if (!SKIP_HTTP) {
  let bad = 0;
  let index = 0;
  const worker = async () => {
    while (index < urls.length) {
      const url = urls[index];
      index += 1;
      try {
        const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
        if (!res.ok) {
          bad += 1;
          console.log(`URL ${res.status} ${url}`);
        }
      } catch (err) {
        bad += 1;
        console.log(`URL ERROR ${url} (${err.message})`);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (bad === 0) console.log(`URL ok - all ${urls.length} Cloudinary URLs answer 200`);
  else problems += bad;
}

console.log('');
console.log(problems === 0 ? 'ALL CHECKS PASSED' : `${problems} problem(s) still open - see above`);
process.exit(problems === 0 ? 0 : 1);
