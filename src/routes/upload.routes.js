import express from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/artwork', optionalAuth, uploadController.uploadArtworkMiddleware, uploadController.handleArtworkUpload);

export default router;
