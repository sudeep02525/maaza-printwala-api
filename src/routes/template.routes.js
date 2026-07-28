import express from 'express';
import * as templateController from '../controllers/template.controller.js';

const router = express.Router();

router.get('/product/:productId', templateController.getTemplatesByProduct);
router.get('/:id', templateController.getTemplateById);

export default router;
