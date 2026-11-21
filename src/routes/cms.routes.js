import express from 'express';
import * as cmsController from '../controllers/cms.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { ROLES } from '../constants/roles.constants.js';

const router = express.Router();

router.get('/homepage', cmsController.getHomepageContent);
router.put('/homepage', authenticate, authorize(ROLES.ADMIN), cmsController.updateHomepageContent);

// Public single-key read - the storefront footer and banners use this
router.get('/key/:key', cmsController.getContentByKey);

export default router;
