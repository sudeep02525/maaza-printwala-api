import express from 'express';
import {
  initiatePayment,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  confirmPaymentDemo,
  reconcilePending,
} from '../controllers/payment.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Webhook route (must receive raw body for HMAC signature verification)
router.post('/webhook/razorpay', express.json(), handleRazorpayWebhook);

// Protected/Session routes
router.use(optionalAuth);

router.post('/initiate', initiatePayment);
router.post('/verify-razorpay', verifyRazorpayPayment);
router.post('/confirm-demo', confirmPaymentDemo);
router.post('/reconcile', reconcilePending);

export default router;
