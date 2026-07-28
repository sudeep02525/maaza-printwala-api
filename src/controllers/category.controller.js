import Category from '../models/Category.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';

export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    return sendSuccess(res, STATUS_CODES.OK, 'Categories fetched successfully', { categories });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug, isActive: true });
    if (!category) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Category not found');
    }
    return sendSuccess(res, STATUS_CODES.OK, 'Category fetched successfully', { category });
  } catch (error) {
    next(error);
  }
};
