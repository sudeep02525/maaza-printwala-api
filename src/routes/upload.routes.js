import express from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { optionalAuth, authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { ROLES } from '../constants/roles.constants.js';

const router = express.Router();

router.post('/artwork', optionalAuth, uploadController.uploadArtworkMiddleware, uploadController.handleArtworkUpload);
router.post('/image', authenticate, authorize(ROLES.ADMIN), uploadController.uploadImageMiddleware, uploadController.handleImageUpload);

export default router;
