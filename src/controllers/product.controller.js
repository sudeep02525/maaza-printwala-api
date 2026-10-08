import Product from '../models/Product.js';
import ProductAttributeSchema from '../models/ProductAttributeSchema.js';
import PricingRule from '../models/PricingRule.js';
import Category from '../models/Category.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';
import { calculateProductPrice } from '../utils/pricing.util.js';
import { searchProducts, refreshIndex } from '../services/search.service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Fuse from 'fuse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



export const getAllProducts = async (req, res, next) => {
  try {
    const { category, search, featured } = req.query;
    let categoryId = null;

    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        categoryId = category;
      } else {
        const catObj = await Category.findOne({ slug: category });
        if (catObj) {
          categoryId = catObj._id;
        } else {
          return sendSuccess(res, STATUS_CODES.OK, 'Products fetched successfully', { products: [] });
        }
      }
    }

    if (search) {
       // Use our fast fuzzy search engine
       let products = searchProducts(search);
       
       // Filter the fuzzy results if category or featured is requested
       if (categoryId) {
          products = products.filter(p => p.category && p.category._id.toString() === categoryId.toString());
       }
       if (featured === 'true') {
          products = products.filter(p => p.isFeatured);
       }
       
       return sendSuccess(res, STATUS_CODES.OK, 'Products fetched successfully', { products });
    }

    // Fallback to DB query if no search string
    const query = { isActive: true };
    if (categoryId) query.category = categoryId;
    if (featured === 'true') query.isFeatured = true;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    const total = await Product.countDocuments(query);

    return sendSuccess(res, STATUS_CODES.OK, 'Products fetched successfully', { 
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
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
      return sendSuccess(res, STATUS_CODES.OK, 'No attribute schema for this product', { schema: null });
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

export const createProduct = async (req, res, next) => {
  try {
    const { name, slug, category, shortDescription, description, basePrice, mrp, artworkRequirements, attributes, quantityTiers, pricingRule, metaTitle, metaDescription, keywords } = req.body;
    const parse = (v, fallback) => { try { return v ? JSON.parse(v) : fallback; } catch { return fallback; } };

    // Process uploaded files
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Save relative path
        images.push(`/images/products/${file.filename}`);
      });
    }

    const newProduct = new Product({
      name,
      slug,
      category,
      shortDescription,
      description,
      basePrice: Number(basePrice) || 0,
      mrp: mrp !== undefined ? Number(mrp) : null,
      images,
      artworkRequirements: parse(artworkRequirements, undefined),
      metaTitle,
      metaDescription,
      keywords: keywords ? (typeof keywords === 'string' ? keywords.split(',').map(k => k.trim()) : keywords) : undefined
    });

    await newProduct.save();
    
    // Create PricingRule (provided or default)
    const pr = parse(pricingRule, null);
    await PricingRule.create({
      product: newProduct._id,
      basePrice: pr?.basePrice ?? newProduct.basePrice,
      quantityBreaks: pr?.quantityBreaks ?? [],
      attributeModifiers: pr?.attributeModifiers ?? []
    });

    // Create ProductAttributeSchema (provided or default)
    const attrs = parse(attributes, []);
    const tiers = parse(quantityTiers, [100, 250, 500, 1000]);
    await ProductAttributeSchema.create({
      product: newProduct._id,
      attributes: attrs,
      quantityTiers: tiers
    });

    // Re-index search asynchronously
    refreshIndex().catch(err => console.error('Index refresh failed:', err));

    return sendSuccess(res, STATUS_CODES.CREATED, 'Product created successfully', { product: newProduct });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, category, shortDescription, description, basePrice, mrp, artworkRequirements, isActive, isFeatured, metaTitle, metaDescription, keywords } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (category !== undefined) updateData.category = category;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (description !== undefined) updateData.description = description;
    if (basePrice !== undefined) updateData.basePrice = Number(basePrice);
    if (mrp !== undefined) updateData.mrp = Number(mrp);
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (keywords !== undefined) updateData.keywords = typeof keywords === 'string' ? keywords.split(',').map(k => k.trim()) : keywords;
    
    if (artworkRequirements && typeof artworkRequirements === 'string') {
      try {
        updateData.artworkRequirements = JSON.parse(artworkRequirements);
      } catch (e) {}
    }

    const product = await Product.findById(id);
    if (!product) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Product not found');
    }

    // If new images are uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/images/products/${file.filename}`);
      
      // Optionally delete old images from filesystem here
      if (product.images && product.images.length > 0) {
        product.images.forEach(imgUrl => {
          const fileName = path.basename(imgUrl);
          const filePath = path.join(__dirname, '..', '..', 'public', 'images', 'products', fileName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      updateData.images = newImages;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
    
    // Re-index search asynchronously
    refreshIndex().catch(err => console.error('Index refresh failed:', err));

    return sendSuccess(res, STATUS_CODES.OK, 'Product updated successfully', { product: updatedProduct });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Product not found');
    }

    // Delete images
    if (product.images && product.images.length > 0) {
      product.images.forEach(imgUrl => {
        const fileName = path.basename(imgUrl);
        const filePath = path.join(__dirname, '..', '..', 'public', 'images', 'products', fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await Product.findByIdAndDelete(id);
    await PricingRule.findOneAndDelete({ product: id });
    await ProductAttributeSchema.findOneAndDelete({ product: id });
    
    // Re-index search asynchronously
    refreshIndex().catch(err => console.error('Index refresh failed:', err));

    return sendSuccess(res, STATUS_CODES.OK, 'Product deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

export const updateProductSchema = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { attributes, quantityTiers } = req.body;
    const schema = await ProductAttributeSchema.findOneAndUpdate(
      { product: id },
      { attributes: attributes || [], quantityTiers: quantityTiers || [100, 250, 500, 1000] },
      { new: true, upsert: true }
    );
    return sendSuccess(res, STATUS_CODES.OK, 'Schema updated', { schema });
  } catch (e) { next(e); }
};

export const updateProductPricing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { basePrice, quantityBreaks, attributeModifiers } = req.body;
    const rule = await PricingRule.findOneAndUpdate(
      { product: id },
      { basePrice, quantityBreaks: quantityBreaks || [], attributeModifiers: attributeModifiers || [] },
      { new: true, upsert: true }
    );
    return sendSuccess(res, STATUS_CODES.OK, 'Pricing updated', { pricingRule: rule });
  } catch (e) { next(e); }
};

export const getProductFull = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [product, schema, pricingRule] = await Promise.all([
      Product.findById(id).populate('category', 'name slug'),
      ProductAttributeSchema.findOne({ product: id }),
      PricingRule.findOne({ product: id }),
    ]);
    if (!product) return sendError(res, STATUS_CODES.NOT_FOUND, 'Product not found');
    return sendSuccess(res, STATUS_CODES.OK, 'Product fetched', { product, schema, pricingRule });
  } catch (e) { next(e); }
};
