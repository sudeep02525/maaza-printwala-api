import DesignProject from '../models/DesignProject.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';

export const saveProject = async (req, res, next) => {
  try {
    const { product, name, designType, uploadedArtworkUrl, template, templateCustomizations, configuration, selectedQuantity, estimatedPrice } = req.body;

    if (!product || !designType) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Product and designType are required');
    }

    const project = await DesignProject.create({
      user: req.user._id,
      product,
      name: name || 'Untitled Project',
      designType,
      uploadedArtworkUrl,
      template,
      templateCustomizations,
      configuration,
      selectedQuantity: selectedQuantity || 100,
      estimatedPrice: estimatedPrice || 0,
      status: 'DRAFT',
    });

    return sendSuccess(res, STATUS_CODES.CREATED, 'Design project saved successfully', { project });
  } catch (error) {
    next(error);
  }
};

export const getMyProjects = async (req, res, next) => {
  try {
    const projects = await DesignProject.find({ user: req.user._id })
      .populate('product', 'name slug images')
      .populate('template', 'name thumbnail')
      .sort({ updatedAt: -1 });

    return sendSuccess(res, STATUS_CODES.OK, 'Projects fetched successfully', { projects });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await DesignProject.findOne({ _id: id, user: req.user._id })
      .populate('product', 'name slug images artworkRequirements')
      .populate('template', 'name thumbnail previewFront editableFields');

    if (!project) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Project not found');
    }

    return sendSuccess(res, STATUS_CODES.OK, 'Project fetched successfully', { project });
  } catch (error) {
    next(error);
  }
};
