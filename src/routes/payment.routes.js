import express from 'express';
import { initiatePayment, confirmPaymentDemo, reconcilePending } from '../controllers/payment.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(optionalAuth);

router.post('/initiate', initiatePayment);
router.post('/confirm-demo', confirmPaymentDemo);
router.post('/reconcile', reconcilePending);

export default router;
