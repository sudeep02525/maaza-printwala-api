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

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/templates', templateRoutes);
router.use('/projects', projectRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/cart', cartRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/payments', paymentRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Maaza Printwala API is operational [Production v1.0.0]',
    timestamp: new Date().toISOString(),
  });
});

export default router;
