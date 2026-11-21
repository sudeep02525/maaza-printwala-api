/**
 * STEP 04 - Rewrite hardcoded image paths in the frontend code
 *
 * Replaces string literals like '/images/cat_mugs_new_1234.png' with the
 * Cloudinary URL from manifest.cloudinary.json, in the storefront and the
 * admin panel source.
 */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MAP_FILE = path.resolve(__dirname, 'manifest.cloudinary.json');
const CODE_EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.json']);

const arg = (name, fallback = null) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};

const flag = (name) => process.argv.includes(`--${name}`);
const APPLY = flag('apply');
const FIX_CONCAT = flag('fix-concat');

const defaultRoots = [
  path.resolve(__dirname, '../../maaza-printwala-web/src'),
  path.resolve(__dirname, '../../maaza-printwala-admin/src'),
];

const roots = (arg('roots') || '')
  ? arg('roots').split(',').map((s) => path.resolve(s.trim())).filter((p) => fs.existsSync(p))
  : defaultRoots.filter((p) => fs.existsSync(p));

if (roots.length === 0) {
  console.error('No source roots found.');
  process.exit(1);
}

if (!fs.existsSync(MAP_FILE)) {
  console.error(`Missing ${MAP_FILE}. Run upload step first.`);
  process.exit(1);
}

const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));

// longest keys first so "/images/products/a.png" wins over "/images/a.png"
const pairs = Object.entries(map)
  .filter(([, v]) => v && v.url)
  .map(([k, v]) => [k, v.url])
  .sort((a, b) => b[0].length - a[0].length);

console.log(`replacement rules: ${pairs.length}`);
console.log(APPLY ? 'MODE: APPLY (files are written)' : 'MODE: DRY RUN (nothing is written)');
console.log('');

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
      walk(full, out);
    } else if (CODE_EXT.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
};

const report = [];

for (const root of roots) {
  const files = walk(root);
  console.log(`${root} -> ${files.length} file(s)`);
  for (const file of files) {
    const base = path.basename(file);
    if (base === 'getImageUrl.js') continue; // this file is supposed to mention /images/
    const before = fs.readFileSync(file, 'utf8');
    let after = before;
    let replaced = 0;
    for (const [key, url] of pairs) {
      for (const quote of ["'", '"', '`']) {
        const needle = `${quote}${key}${quote}`;
        if (!after.includes(needle)) continue;
        const hits = after.split(needle).length - 1;
        after = after.split(needle).join(`${quote}${url}${quote}`);
        replaced += hits;
      }
    }
    let concatFixed = 0;
    if (FIX_CONCAT && after.includes('process.env.NEXT_PUBLIC_API_URL')) {
      // case 1: src={`${process.env.NEXT_PUBLIC_API_URL}${expr}`}
      const braced = /\{`\$\{process\.env\.NEXT_PUBLIC_API_URL[^}]*\}\$\{([^}]+)\}`\}/g;
      // case 2: bare template literal, no surrounding braces
      const bare = /`\$\{process\.env\.NEXT_PUBLIC_API_URL[^}]*\}\$\{([^}]+)\}`/g;
      concatFixed = (after.match(braced) || []).length + (after.match(bare) || []).length;
      after = after.replace(braced, (_m, expr) => `{getImageUrl(${expr})}`);
      after = after.replace(bare, (_m, expr) => `getImageUrl(${expr})`);
      if (concatFixed > 0 && !/import\s+.*getImageUrl.*from/.test(after)) {
        const importLine = `import { getImageUrl } from '@/utils/getImageUrl.js';\n`;
        const lastImport = [...after.matchAll(/^import .*;$/gm)].pop();
        if (lastImport) {
          const at = lastImport.index + lastImport[0].length + 1;
          after = after.slice(0, at) + importLine + after.slice(at);
        } else {
          after = importLine + after;
        }
      }
    }
    if (after === before) continue;
    report.push({ file: path.relative(process.cwd(), file), replaced, concatFixed });
    if (APPLY) fs.writeFileSync(file, after);
  }
}

console.log('');
if (report.length === 0) {
  console.log('No hardcoded local image paths left in the source. Nothing to do.');
} else {
  console.table(report);
  console.log(
    APPLY
      ? `Updated ${report.length} file(s).`
      : `Dry run: ${report.length} file(s) would change. Re-run with --apply.`
  );
}
