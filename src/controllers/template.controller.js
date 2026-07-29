import Template from '../models/Template.js';
import Product from '../models/Product.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';

export const getTemplatesByProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    let targetId = productId;
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      const p = await Product.findOne({ slug: productId });
      if (!p) return sendError(res, STATUS_CODES.NOT_FOUND, 'Product not found');
      targetId = p._id;
    }

    const templates = await Template.find({ product: targetId, isActive: true });
    return sendSuccess(res, STATUS_CODES.OK, 'Templates fetched successfully', { templates });
  } catch (error) {
    next(error);
  }
};

export const getTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await Template.findById(id).populate('product', 'name slug');
    if (!template) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Template not found');
    }
    return sendSuccess(res, STATUS_CODES.OK, 'Template fetched successfully', { template });
  } catch (error) {
    next(error);
  }
};

export const getAllTemplates = async (req, res, next) => {
  try {
    const templates = await Template.find({ isActive: true }).populate('product', 'name slug').limit(20);
    return sendSuccess(res, STATUS_CODES.OK, 'All templates fetched successfully', { templates });
  } catch (error) {
    next(error);
  }
};

