import express from 'express';
import * as checkoutController from '../controllers/checkout.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// All checkout endpoints support optional authentication (authenticated user OR guest session cookie)
router.use(optionalAuth);

router.get('/init', checkoutController.getOrInitDraft);
router.get('/delivery-methods', checkoutController.getDeliveryMethods);
router.patch('/contact', checkoutController.updateContact);
router.patch('/address', checkoutController.updateAddress);
router.patch('/billing', checkoutController.updateBilling);
router.post('/delivery-method', checkoutController.selectDeliveryRule);
router.post('/prepare-payment', checkoutController.reviewAndPreparePayment);

export default router;
