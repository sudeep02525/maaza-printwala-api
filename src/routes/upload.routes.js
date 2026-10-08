import express from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/artwork', authenticate, uploadController.uploadArtworkMiddleware, uploadController.handleArtworkUpload);

export default router;
