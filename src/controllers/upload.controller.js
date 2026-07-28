import multer from 'multer';
import path from 'path';
import storageService from '../services/storage.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/postscript',
  'application/illustrator',
  'application/x-adobe-indesign',
  'image/tiff',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Invalid print artwork format. Allowed formats: PDF, PNG, JPG, EPS, AI, WEBP, TIFF.'));
    }
    cb(null, true);
  },
}).single('artwork');

export const uploadArtworkMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, STATUS_CODES.BAD_REQUEST, 'Artwork file size exceeds maximum limit of 25MB.');
      }
      return sendError(res, STATUS_CODES.BAD_REQUEST, err.message);
    } else if (err) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, err.message);
    }
    next();
  });
};

export const handleArtworkUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'No artwork file provided.');
    }

    const { buffer, mimetype, originalname } = req.file;
    const ext = path.extname(originalname || '').slice(1) || 'pdf';

    // Pass buffer to storage abstraction service (which generates secure name and discards client filename)
    const storedFile = await storageService.saveArtworkFile(buffer, mimetype, ext);

    return sendSuccess(res, STATUS_CODES.CREATED, 'Artwork uploaded and verified successfully.', {
      artwork: storedFile,
    });
  } catch (error) {
    next(error);
  }
};
