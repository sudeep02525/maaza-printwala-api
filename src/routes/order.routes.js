import express from 'express';
import { uploadArtwork } from '../middleware/upload.middleware.js';
import * as orderController from '../controllers/order.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(optionalAuth);

router.post('/exchange-tracking-token', orderController.exchangeTrackingToken);
router.get('/track/:orderNumber', orderController.getOrderByNumber);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);

export default router;
