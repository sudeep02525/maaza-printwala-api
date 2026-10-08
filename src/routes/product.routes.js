import express from 'express';
import * as productController from '../controllers/product.controller.js';
import * as searchController from '../controllers/search.controller.js';
import { uploadProductImage } from '../middleware/upload.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { ROLES } from '../constants/roles.constants.js';

const router = express.Router();

router.get('/', productController.getAllProducts);
router.get('/suggestions', searchController.getSearchSuggestions);
router.get('/:id', productController.getProductByIdOrSlug);
router.get('/:id/schema', productController.getProductSchema);
router.post('/:id/price', productController.calculatePrice);

// Admin Routes
router.post('/', authenticate, authorize(ROLES.ADMIN), uploadProductImage.array('images', 5), productController.createProduct);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), uploadProductImage.array('images', 5), productController.updateProduct);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), productController.deleteProduct);

export default router;
