import express from 'express';
import * as searchController from '../controllers/search.controller.js';

const router = express.Router();

router.get('/suggestions', searchController.getSearchSuggestions);
router.post('/log', searchController.logSearch);

export default router;
