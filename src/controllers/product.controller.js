import Product from '../models/Product.js';
import ProductAttributeSchema from '../models/ProductAttributeSchema.js';
import PricingRule from '../models/PricingRule.js';
import Category from '../models/Category.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';
import { calculateProductPrice } from '../utils/pricing.util.js';

export const getAllProducts = async (req, res, next) => {
  try {
    const { category, search, featured } = req.query;
    const query = { isActive: true };

    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const catObj = await Category.findOne({ slug: category });
        if (catObj) {
          query.category = catObj._id;
        } else {
          return sendSuccess(res, STATUS_CODES.OK, 'Products fetched successfully', { products: [] });
        }
      }
    }
    if (featured === 'true') {
      query.isFeatured = true;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query).populate('category', 'name slug').sort({ updatedAt: -1 });

    return sendSuccess(res, STATUS_CODES.OK, 'Products fetched successfully', { products });
  } catch (error) {
    next(error);
  }
};

export const getProductByIdOrSlug = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };

    const product = await Product.findOne(query).populate('category', 'name slug');
    if (!product) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Product not found');
    }

    return sendSuccess(res, STATUS_CODES.OK, 'Product fetched successfully', { product });
  } catch (error) {
    next(error);
  }
};

export const getProductSchema = async (req, res, next) => {
  try {
    const { id } = req.params;
    let productId = id;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      const p = await Product.findOne({ slug: id });
      if (!p) return sendError(res, STATUS_CODES.NOT_FOUND, 'Product not found');
      productId = p._id;
    }

    const schema = await ProductAttributeSchema.findOne({ product: productId });
    if (!schema) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Attribute schema not found for this product');
    }

    return sendSuccess(res, STATUS_CODES.OK, 'Product schema fetched successfully', { schema });
  } catch (error) {
    next(error);
  }
};

export const calculatePrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { configuration, quantity } = req.body;

    let productId = id;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      const p = await Product.findOne({ slug: id });
      if (!p) return sendError(res, STATUS_CODES.NOT_FOUND, 'Product not found');
      productId = p._id;
    }

    const [pricingRule, attributeSchema] = await Promise.all([
      PricingRule.findOne({ product: productId }),
      ProductAttributeSchema.findOne({ product: productId }),
    ]);

    if (!pricingRule) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Pricing rule not found for this product');
    }

    const priceResult = calculateProductPrice(pricingRule, attributeSchema, configuration || {}, Number(quantity) || 100);

    return sendSuccess(res, STATUS_CODES.OK, 'Price calculated successfully', priceResult);
  } catch (error) {
    next(error);
  }
};
