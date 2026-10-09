import express from 'express';
import * as templateController from '../controllers/template.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { ROLES } from '../constants/roles.constants.js';

const router = express.Router();

router.get('/', templateController.getAllTemplates);
router.get('/product/:productId', templateController.getTemplatesByProduct);
router.get('/:id', templateController.getTemplateById);

router.post('/', authenticate, authorize(ROLES.ADMIN), templateController.createTemplate);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), templateController.updateTemplate);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), templateController.deleteTemplate);

export default router;

