import express from 'express';
import * as productController from '../controllers/product.controller.js';

const router = express.Router();

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductByIdOrSlug);
router.get('/:id/schema', productController.getProductSchema);
router.post('/:id/price', productController.calculatePrice);

export default router;
