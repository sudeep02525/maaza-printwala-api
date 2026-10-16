import express from 'express';
import { getPublicSettings } from '../controllers/admin.controller.js';

const router = express.Router();

// Public store settings
router.get('/', getPublicSettings);

export default router;
