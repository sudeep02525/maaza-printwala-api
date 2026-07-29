import express from 'express';
import * as cmsController from '../controllers/cms.controller.js';

const router = express.Router();

router.get('/homepage', cmsController.getHomepageContent);

export default router;
