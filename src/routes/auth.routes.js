import express from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Strict rate limit for brute-force sensitive endpoints (10 attempts / 15 min)
const strictLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes before trying again.' },
  validate: { xForwardedForHeader: false }
});

router.post('/register', authController.register);
router.post('/login', strictLoginLimiter, authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getProfile);
router.post('/refresh', authController.refresh);

// Password recovery
router.post('/forgot-password', strictLoginLimiter, authController.forgotPassword);
router.post('/reset-password', strictLoginLimiter, authController.resetPassword);

// Profile & Security (authenticated)
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);

// Address Book (authenticated)
router.get('/addresses', authenticate, authController.getAddresses);
router.post('/addresses', authenticate, authController.createAddress);
router.put('/addresses/:id', authenticate, authController.updateAddress);
router.delete('/addresses/:id', authenticate, authController.deleteAddress);
router.patch('/addresses/:id/default', authenticate, authController.setDefaultAddress);

export default router;
