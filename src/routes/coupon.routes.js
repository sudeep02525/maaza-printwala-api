import express from 'express';
import * as couponController from '../controllers/coupon.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { ROLES } from '../constants/roles.constants.js';

const router = express.Router();

// Public routes
router.post('/validate', couponController.validateCoupon);
router.get('/active', couponController.getActiveCoupons);

// Admin routes
router.get('/admin', authenticate, authorize(ROLES.ADMIN), couponController.getAdminCoupons);
router.post('/admin', authenticate, authorize(ROLES.ADMIN), couponController.createCoupon);
router.put('/admin/:id', authenticate, authorize(ROLES.ADMIN), couponController.updateCoupon);
router.delete('/admin/:id', authenticate, authorize(ROLES.ADMIN), couponController.deleteCoupon);

export default router;
