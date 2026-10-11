import express from 'express';
import * as inquiryController from '../controllers/inquiry.controller.js';
import { optionalAuth, authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { ROLES } from '../constants/roles.constants.js';

const router = express.Router();

// Public submission routes
router.post('/bulk', inquiryController.submitBulkEnquiry);
router.post('/support', optionalAuth, inquiryController.submitSupportRequest);

// Admin routes
router.get('/bulk/admin', authenticate, authorize(ROLES.ADMIN), inquiryController.getAdminBulkEnquiries);
router.patch('/bulk/admin/:id', authenticate, authorize(ROLES.ADMIN), inquiryController.updateBulkEnquiryStatus);
router.get('/support/admin', authenticate, authorize(ROLES.ADMIN), inquiryController.getAdminSupportRequests);
router.patch('/support/admin/:id', authenticate, authorize(ROLES.ADMIN), inquiryController.updateSupportRequestStatus);

export default router;
