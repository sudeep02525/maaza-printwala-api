import express from 'express';
import * as projectController from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);
router.post('/', projectController.saveProject);
router.get('/', projectController.getMyProjects);
router.get('/:id', projectController.getProjectById);

export default router;
