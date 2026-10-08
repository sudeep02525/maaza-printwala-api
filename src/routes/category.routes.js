import express from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { ROLES } from '../constants/roles.constants.js';

const router = express.Router();

router.get('/', categoryController.getAllCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

router.post('/', authenticate, authorize(ROLES.ADMIN), categoryController.createCategory);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), categoryController.updateCategory);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), categoryController.deleteCategory);

export default router;
