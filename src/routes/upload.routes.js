import express from 'express';
import * as uploadController from '../controllers/upload.controller.js';

const router = express.Router();

router.post('/artwork', uploadController.uploadArtworkMiddleware, uploadController.handleArtworkUpload);

export default router;
