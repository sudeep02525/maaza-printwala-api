import Template from '../models/Template.js';
import Product from '../models/Product.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';

export const getTemplatesByProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    console.log('Fetching templates for product:', productId);
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
    const templates = await Template.find().populate('product', 'name slug');
    return sendSuccess(res, STATUS_CODES.OK, 'All templates fetched successfully', { templates });
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const template = new Template(req.body);
    await template.save();
    return sendSuccess(res, STATUS_CODES.CREATED, 'Template created successfully', { template });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const template = await Template.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!template) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Template not found');
    }
    return sendSuccess(res, STATUS_CODES.OK, 'Template updated successfully', { template });
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const template = await Template.findByIdAndDelete(req.params.id);
    if (!template) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Template not found');
    }
    return sendSuccess(res, STATUS_CODES.OK, 'Template deleted successfully');
  } catch (error) {
    next(error);
  }
};