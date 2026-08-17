import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directories exist
const productsDir = path.join(__dirname, '..', '..', 'public', 'images', 'products');
const artworkDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'artwork');

if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}
if (!fs.existsSync(artworkDir)) {
  fs.mkdirSync(artworkDir, { recursive: true });
}

// Storage for Product Images
const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, productsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage for Artwork Uploads
const artworkStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, artworkDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'artwork-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filters
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'), false);
  }
};

const artworkFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'application/illustrator', 'image/vnd.adobe.photoshop'];
  if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|png|jpg|jpeg|ai|psd)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, PNG, JPG, AI, and PSD files are allowed!'), false);
  }
};

export const uploadProductImage = multer({ storage: productStorage, fileFilter: imageFilter });
export const uploadArtwork = multer({ storage: artworkStorage, fileFilter: artworkFilter });
