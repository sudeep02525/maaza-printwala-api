import fs from 'fs';
import path from 'path';

const webImagesDir = path.join(process.cwd(), '..', 'maaza-printwala-web', 'public', 'images');
const apiImagesDir = path.join(process.cwd(), 'public', 'images');

// 3 specific hero banner images to EXCLUDE from moving
const excludeFiles = [
  'hero_banner_main.png',
  'corp_gifting_banner.png',
  'visiting_cards_banner.png'
];

if (!fs.existsSync(apiImagesDir)) {
  fs.mkdirSync(apiImagesDir, { recursive: true });
}

if (!fs.existsSync(webImagesDir)) {
  console.log('Web images directory not found.');
  process.exit(1);
}

let movedCount = 0;
let skippedCount = 0;

const files = fs.readdirSync(webImagesDir);

for (const file of files) {
  const webFilePath = path.join(webImagesDir, file);
  const apiFilePath = path.join(apiImagesDir, file);

  const stats = fs.statSync(webFilePath);
  
  if (stats.isFile()) {
    if (excludeFiles.includes(file)) {
      console.log(`Skipping excluded file: ${file}`);
      skippedCount++;
    } else {
      // Copy to API
      fs.copyFileSync(webFilePath, apiFilePath);
      console.log(`Moved: ${file}`);
      // Delete from WEB
      fs.unlinkSync(webFilePath);
      movedCount++;
    }
  }
}

console.log(`\nMigration Complete:`);
console.log(`Moved ${movedCount} files.`);
console.log(`Skipped ${skippedCount} files.`);
