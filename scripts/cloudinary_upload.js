/**
 * STEP 02 - Upload to Cloudinary
 *
 * Uploads every unique image from manifest.inventory.json and writes
 * manifest.cloudinary.json, which maps each served local path to its
 * Cloudinary URL:
 *
 * { "/images/products/a.png": { "url": "https://res.cloudinary.com/.../a.png", ... } }
 *
 * Safe to re-run: files already present in manifest.cloudinary.json are skipped.
 */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const IN_FILE = path.resolve(__dirname, 'manifest.inventory.json');
const OUT_FILE = path.resolve(__dirname, 'manifest.cloudinary.json');
const CONCURRENCY = 3;
const MAX_RETRIES = 3;

const arg = (name, fallback = null) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};

const flag = (name) => process.argv.includes(`--${name}`);
const DRY_RUN = flag('dry-run');
const FORCE = flag('force');
const ONLY = arg('only');
const ROOT_FOLDER = process.env.CLOUDINARY_ROOT_FOLDER || 'maaza-printwala';

const DEFAULT_EXCLUDE = [
  '/icon.png',
  '/apple-icon.png',
  '/favicon.ico',
  '/logo-maaza.png',
  '/logo-maaza-dark.png',
  '/logo-maaza-1.png',
  '/Logo -',
  '/Logo 1_',
];

const EXCLUDE = flag('include-all')
  ? []
  : (process.env.EXCLUDE_KEYS ? process.env.EXCLUDE_KEYS.split(',').map((s) => s.trim()) : DEFAULT_EXCLUDE);

if (!fs.existsSync(IN_FILE)) {
  console.error(`Missing ${IN_FILE}. Run inventory first.`);
  process.exit(1);
}

const inventory = JSON.parse(fs.readFileSync(IN_FILE, 'utf8'));
const done = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) : {};

const missingEnv = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].filter(
  (k) => !process.env[k]
);

if (missingEnv.length && !DRY_RUN) {
  console.error(`Missing env: ${missingEnv.join(', ')}`);
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/** "/images/products/a.png" -> folder "maaza-printwala/images/products", id "a" */
const target = (key) => {
  const dir = path.posix.dirname(key); // "/images/products"
  const base = path.posix.basename(key);
  const raw = base.replace(path.posix.extname(base), '');
  // Cloudinary ids should stay URL-safe: "Logo -Maza Printwala" -> "Logo-Maza-Printwala"
  const id = raw.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const folder = [ROOT_FOLDER, dir.replace(/^\/+/, '')].filter(Boolean).join('/');
  return { folder, publicId: id };
};

const queue = inventory.items.filter((item) => {
  if (ONLY && !item.key.startsWith(ONLY)) return false;
  if (EXCLUDE.some((pattern) => item.key.includes(pattern))) return false;
  if (FORCE) return true;
  return !done[item.key];
});

console.log(`to upload: ${queue.length} of ${inventory.items.length}`);

const uploadOne = async (item) => {
  const { folder, publicId } = target(item.key);
  if (DRY_RUN) {
    console.log(` would upload ${item.key} -> ${folder}/${publicId} (${(item.bytes / 1024).toFixed(0)} KB)`);
    return null;
  }
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const res = await cloudinary.uploader.upload(item.file, {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        invalidate: true,
        use_filename: false,
        unique_filename: false,
      });
      return {
        url: res.secure_url,
        publicId: res.public_id,
        format: res.format,
        width: res.width,
        height: res.height,
        bytes: res.bytes,
        uploadedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        console.error(` FAILED ${item.key}: ${err.message}`);
        return { error: err.message };
      }
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  return null;
};

const save = () => fs.writeFileSync(OUT_FILE, JSON.stringify(done, null, 2));

let ok = 0;
let failed = 0;
let index = 0;

const worker = async () => {
  while (index < queue.length) {
    const item = queue[index];
    index += 1;
    const result = await uploadOne(item);
    if (result && !result.error) {
      done[item.key] = result;
      // every duplicate path maps to the same Cloudinary URL
      for (const alias of item.allKeys || []) done[alias] = result;
      ok += 1;
      if (ok % 10 === 0) {
        save();
        console.log(` ${ok}/${queue.length} uploaded`);
      }
    } else if (result && result.error) {
      failed += 1;
    }
  }
};

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

if (!DRY_RUN) {
  save();
  console.log('');
  console.log(`uploaded: ${ok}`);
  console.log(`failed  : ${failed}`);
  console.log(`written : ${OUT_FILE}`);
  console.log('');
  console.log('Next: node scripts/cloudinary_rewrite_db.js (dry run, then --apply)');
}
