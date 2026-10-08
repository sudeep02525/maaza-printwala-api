import express from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import templateRoutes from './template.routes.js';
import projectRoutes from './project.routes.js';
import orderRoutes from './order.routes.js';
import adminRoutes from './admin.routes.js';
import uploadRoutes from './upload.routes.js';
import cartRoutes from './cart.routes.js';
import checkoutRoutes from './checkout.routes.js';
import paymentRoutes from './payment.routes.js';
import cmsRoutes from './cms.routes.js';
import searchRoutes from './search.routes.js';

import rateLimit from 'express-rate-limit';

const router = express.Router();

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' }
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many uploads, please try again later.' }
});

router.use(globalLimiter);

router.use('/auth', authLimiter, authRoutes);
router.use('/search', searchRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/templates', templateRoutes);
router.use('/projects', projectRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadLimiter, uploadRoutes);
router.use('/cart', cartRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/payments', paymentRoutes);
router.use('/cms', cmsRoutes);


router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Maza Printwala API is operational [Production v1.0.0]',
    timestamp: new Date().toISOString(),
  });
});

export default router;
