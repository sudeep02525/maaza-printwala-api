import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getProfile);
router.post('/refresh', authController.refresh);

// Password recovery
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

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
