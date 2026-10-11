import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { ROLES } from '../constants/roles.constants.js';

const router = express.Router();

router.get('/', authenticate, notificationController.getMyNotifications);
router.patch('/:id/read', authenticate, notificationController.markNotificationRead);
router.post('/send', authenticate, authorize(ROLES.ADMIN), notificationController.createNotification);

export default router;
