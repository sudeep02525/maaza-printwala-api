/**
 * STEP 01 - Cloudinary Inventory
 *
 * Walks the public/ folders of the storefront, the admin panel and the API,
 * finds every image, groups identical files by content hash, and writes
 * manifest.inventory.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif']);
const OUT_FILE = path.resolve(__dirname, 'manifest.inventory.json');

const arg = (name, fallback = null) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};

const defaultRoots = [
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, '../../maaza-printwala-web/public'),
  path.resolve(__dirname, '../../maaza-printwala-admin/public')
];

const roots = (arg('roots') || process.env.IMAGE_ROOTS || '')
  ? (arg('roots') || process.env.IMAGE_ROOTS).split(',').map((s) => path.resolve(__dirname, s.trim())).filter(Boolean)
  : defaultRoots;

const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
};

const sha256 = (file) => {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(file));
  return hash.digest('hex');
};

/** "/…/maaza-printwala-api/public/images/products/a.png" -> "/images/products/a.png" */
const servedKey = (publicDir, file) => {
  const rel = path.relative(publicDir, file).split(path.sep).join('/');
  return `/${rel}`;
};

const byHash = new Map();
let totalBytes = 0;
let totalFiles = 0;

for (const root of roots) {
  if (!fs.existsSync(root)) {
    console.warn(`skip (missing): ${root}`);
    continue;
  }
  const files = walk(root);
  console.log(`${root} -> ${files.length} image(s)`);
  for (const file of files) {
    totalFiles += 1;
    const stat = fs.statSync(file);
    totalBytes += stat.size;
    const digest = sha256(file);
    const key = servedKey(root, file);
    if (!byHash.has(digest)) {
      byHash.set(digest, {
        key,
        file,
        sha256: digest,
        bytes: stat.size,
        duplicates: [],
        allKeys: [key],
      });
    } else {
      const entry = byHash.get(digest);
      entry.duplicates.push(file);
      if (!entry.allKeys.includes(key)) entry.allKeys.push(key);
    }
  }
}

const items = [...byHash.values()].sort((a, b) => a.key.localeCompare(b.key));
const uniqueBytes = items.reduce((sum, i) => sum + i.bytes, 0);

const manifest = {
  generatedAt: new Date().toISOString(),
  roots,
  stats: {
    filesFound: totalFiles,
    uniqueFiles: items.length,
    duplicateFiles: totalFiles - items.length,
    totalBytes,
    uniqueBytes,
  },
  items,
};

fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2));

console.log('');
console.log(`files found      : ${totalFiles}`);
console.log(`unique by content: ${items.length}`);
console.log(`duplicates       : ${totalFiles - items.length}`);
console.log(`size to upload   : ${(uniqueBytes / 1e6).toFixed(1)} MB`);
console.log(`written          : ${OUT_FILE}`);
console.log('');
console.log('Next: node scripts/cloudinary_upload.js --dry-run');
