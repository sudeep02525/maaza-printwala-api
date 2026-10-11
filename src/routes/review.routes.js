import express from 'express';
import * as reviewController from '../controllers/review.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { ROLES } from '../constants/roles.constants.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);

// User submission route (requires authentication)
router.post('/product/:productId', authenticate, reviewController.createReview);

// Admin routes
router.get('/admin', authenticate, authorize(ROLES.ADMIN), reviewController.getAdminReviews);
router.patch('/admin/:id/approval', authenticate, authorize(ROLES.ADMIN), reviewController.toggleReviewApproval);
router.delete('/admin/:id', authenticate, authorize(ROLES.ADMIN), reviewController.deleteReview);

export default router;
