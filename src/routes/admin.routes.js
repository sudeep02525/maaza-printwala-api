import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { ROLES } from '../constants/roles.constants.js';

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));
router.get('/stats', adminController.getDashboardStats);
router.get('/orders', adminController.getAllOrdersAdmin);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.get('/users', adminController.getAllUsersAdmin);

// Reports & Analytics
router.get('/reports', adminController.getReportsAdmin);

// Delivery Rules Management
router.get('/delivery-rules', adminController.getDeliveryRulesAdmin);
router.post('/delivery-rules', adminController.createDeliveryRuleAdmin);
router.put('/delivery-rules/:id', adminController.updateDeliveryRuleAdmin);
router.delete('/delivery-rules/:id', adminController.deleteDeliveryRuleAdmin);

export default router;
