import fs from 'fs';
import path from 'path';

const webImagesDir = path.join(process.cwd(), '..', 'maaza-printwala-web', 'public', 'images');
const apiImagesDir = path.join(process.cwd(), 'public', 'images');

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  
  const items = fs.readdirSync(from);
  for (const item of items) {
    const fromPath = path.join(from, item);
    const toPath = path.join(to, item);
    const stats = fs.statSync(fromPath);
    
    if (stats.isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  }
}

function removeFolderSync(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.statSync(curPath).isDirectory()) {
        removeFolderSync(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

const dirsToMove = ['subcategories', 'products'];

for (const dir of dirsToMove) {
  const webPath = path.join(webImagesDir, dir);
  const apiPath = path.join(apiImagesDir, dir);
  
  if (fs.existsSync(webPath)) {
    console.log(`Copying ${dir} to backend...`);
    copyFolderSync(webPath, apiPath);
    console.log(`Removing ${dir} from frontend...`);
    removeFolderSync(webPath);
    console.log(`${dir} moved successfully.`);
  } else {
    console.log(`${dir} not found in frontend.`);
  }
}
