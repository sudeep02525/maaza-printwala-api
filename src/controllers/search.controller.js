import { getSuggestions } from '../services/search.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';

export const getSearchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    // Pass to search service which handles both empty and typed queries
    const suggestions = getSuggestions(q);
    
    return sendSuccess(res, STATUS_CODES.OK, 'Suggestions fetched successfully', suggestions);
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return sendError(res, STATUS_CODES.INTERNAL_SERVER_ERROR, 'Failed to fetch suggestions');
  }
};
