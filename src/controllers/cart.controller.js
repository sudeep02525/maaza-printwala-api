import crypto from 'crypto';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import ProductAttributeSchema from '../models/ProductAttributeSchema.js';
import PricingRule from '../models/PricingRule.js';
import Template from '../models/Template.js';
import storageService from '../services/storage.service.js';
import { calculateProductPrice } from '../utils/pricing.util.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';

/**
 * Resolves session from cookie (or header fallback for test scripts),
 * sets httpOnly cookie for unauthenticated guests if missing.
 */
export const resolveSession = (req, res) => {
  let sessionId = req.cookies?.maaza_cart_session;
  if (!sessionId && req.headers['x-cart-session-id']) {
    sessionId = req.headers['x-cart-session-id'];
  }
  let query = {};
  if (req.user && req.user._id) {
    query.user = req.user._id;
  } else {
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      if (res && typeof res.cookie === 'function') {
        res.cookie('maaza_cart_session', sessionId, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
      }
    }
    query.sessionId = sessionId;
  }
  return { query, sessionId };
};

export const getOrCreateCart = async (query, sessionId) => {
  let cart = await Cart.findOne(query).populate('items.product', 'name slug isFeatured');
  if (!cart) {
    cart = new Cart({
      ...query,
      items: [],
      cartTotal: 0,
    });
    await cart.save();
  }
  return cart;
};

export const recalculateCartTotal = (cart) => {
  const total = cart.items.reduce((acc, item) => acc + (Number(item.authoritativeLineTotal) || 0), 0);
  cart.cartTotal = Math.round(total * 100) / 100;
};

/**
 * Server-Side Validation and Authoritative Price Calculation for Cart Item
 */
export const validateAndPriceItem = async (productId, configuration, quantity, dimensions, designType, artwork, template) => {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw { status: 400, message: 'Selected product is unavailable or inactive.' };
  }

  const schema = await ProductAttributeSchema.findOne({ product: product._id });
  const pricingRule = await PricingRule.findOne({ product: product._id });
  if (!schema || !pricingRule) {
    throw { status: 400, message: 'Configuration schema or pricing rules missing for this product.' };
  }

  const configObj = configuration ? { ...configuration } : {};
  schema.attributes.forEach((attr) => {
    if (attr.isRequired && attr.type !== 'numeric-range' && !configObj[attr.key]) {
      throw { status: 400, message: `Missing required configuration attribute: ${attr.label || attr.key}` };
    }
    if (attr.options && attr.options.length > 0 && configObj[attr.key]) {
      const validOpt = attr.options.find((o) => String(o.value) === String(configObj[attr.key]));
      if (!validOpt) {
        throw { status: 400, message: `Invalid option '${configObj[attr.key]}' for attribute '${attr.label || attr.key}'.` };
      }
    }
  });

  let validDims = dimensions ? { ...dimensions } : {};
  const dimAttr = schema.attributes.find((a) => a.type === 'numeric-range');
  if (dimAttr) {
    const w = Number(validDims.width || configObj.width) || 0;
    const h = Number(validDims.height || configObj.height) || 0;
    if (w < dimAttr.minRange || w > dimAttr.maxRange) {
      throw { status: 400, message: `Width ${w} is outside allowed range (${dimAttr.minRange} - ${dimAttr.maxRange} ${dimAttr.unit || 'ft'}).` };
    }
    if (h < dimAttr.minRange || h > dimAttr.maxRange) {
      throw { status: 400, message: `Height ${h} is outside allowed range (${dimAttr.minRange} - ${dimAttr.maxRange} ${dimAttr.unit || 'ft'}).` };
    }
    validDims = { width: w, height: h, unit: dimAttr.unit || 'ft' };
    configObj.width = w;
    configObj.height = h;
  }

  const qty = Number(quantity);
  if (isNaN(qty) || qty < 1) {
    throw { status: 400, message: 'Quantity must be a positive integer.' };
  }
  if (schema.quantityTiers && schema.quantityTiers.length > 0) {
    const isTier = schema.quantityTiers.includes(qty);
    const minTier = Math.min(...schema.quantityTiers);
    if (!isTier && qty < minTier) {
      throw { status: 400, message: `Quantity ${qty} is below minimum required quantity (${minTier}).` };
    }
  }

  let authArtwork = null;
  let authTemplate = null;

  if (designType === 'UPLOAD') {
    if (!artwork || !artwork.fileId) {
      throw { status: 400, message: 'Artwork file reference is required for UPLOAD design type.' };
    }
    const verifiedArt = await storageService.verifyArtworkExists(artwork.fileId);
    if (!verifiedArt) {
      throw { status: 400, message: 'Artwork file verification failed. Uploaded file does not exist in server storage.' };
    }
    authArtwork = {
      fileId: verifiedArt.fileId,
      fileUrl: verifiedArt.fileUrl,
      originalName: artwork.originalName || verifiedArt.fileId,
    };
  } else if (designType === 'TEMPLATE') {
    if (!template || !template.templateId) {
      throw { status: 400, message: 'Template reference is required for TEMPLATE design type.' };
    }
    const tmplObj = await Template.findById(template.templateId);
    if (!tmplObj || String(tmplObj.product) !== String(product._id)) {
      throw { status: 400, message: 'Selected template does not exist or does not belong to this product.' };
    }
    const allowedKeys = (tmplObj.editableFields || []).map((f) => f.label || f.key);
    let incomingFields = {};
    if (template.customFields) {
      if (template.customFields instanceof Map || typeof template.customFields.get === 'function') {
        incomingFields = Object.fromEntries(template.customFields);
      } else if (typeof template.customFields.toJSON === 'function') {
        incomingFields = template.customFields.toJSON();
      } else {
        incomingFields = template.customFields;
      }
    }
    const cleanFields = {};
    Object.keys(incomingFields).forEach((key) => {
      if (key.startsWith('$') || key.startsWith('_')) return; // Ignore Mongoose internal keys
      if (!allowedKeys.includes(key)) {
        throw { status: 400, message: `Invalid custom field key submitted: '${key}'. Allowed keys: ${allowedKeys.join(', ')}` };
      }
      cleanFields[key] = String(incomingFields[key]);
    });
    authTemplate = {
      templateId: tmplObj._id,
      templateName: tmplObj.name,
      previewUrl: tmplObj.previewUrl,
      customFields: cleanFields,
    };
  } else {
    throw { status: 400, message: "Invalid design type. Must be 'UPLOAD' or 'TEMPLATE'." };
  }

  const priceResult = calculateProductPrice(pricingRule, schema, configObj, qty);

  return {
    product: product._id,
    productNameSnapshot: product.name,
    productImageSnapshot: product.images && product.images[0] ? product.images[0].url : '',
    configurationSnapshot: configObj,
    dimensions: validDims,
    quantity: qty,
    designType,
    artwork: authArtwork,
    template: authTemplate,
    authoritativeUnitPrice: priceResult.finalUnitPrice,
    authoritativeLineTotal: priceResult.totalPrice,
  };
};

export const getCart = async (req, res, next) => {
  try {
    const { query, sessionId } = resolveSession(req, res);
    const cart = await getOrCreateCart(query, sessionId);
    return sendSuccess(res, STATUS_CODES.OK, 'Cart fetched successfully', { cart });
  } catch (error) {
    next(error);
  }
};

export const addItemToCart = async (req, res, next) => {
  try {
    const { query, sessionId } = resolveSession(req, res);
    const { productId, configuration, quantity, dimensions, designType, artwork, template } = req.body;

    if (!productId) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Product ID is required.');
    }

    const itemData = await validateAndPriceItem(productId, configuration, quantity, dimensions, designType, artwork, template);

    const cart = await getOrCreateCart(query, sessionId);
    cart.items.push(itemData);
    recalculateCartTotal(cart);
    await cart.save();

    await cart.populate('items.product', 'name slug isFeatured');
    return sendSuccess(res, STATUS_CODES.CREATED, 'Item added to cart securely', { cart });
  } catch (error) {
    if (error.status) {
      return sendError(res, error.status, error.message);
    }
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { query, sessionId } = resolveSession(req, res);
    const { itemId } = req.params;
    const { quantity, configuration, dimensions } = req.body;

    const cart = await Cart.findOne(query);
    if (!cart) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Cart not found.');
    }

    const itemIndex = cart.items.findIndex((i) => i._id.toString() === itemId);
    if (itemIndex === -1) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Cart item not found.');
    }

    const existingItem = cart.items[itemIndex];
    const newQty = quantity !== undefined ? quantity : existingItem.quantity;
    let newConfig = configuration;
    if (newConfig === undefined) {
      if (existingItem.configurationSnapshot instanceof Map || typeof existingItem.configurationSnapshot?.get === 'function') {
        newConfig = Object.fromEntries(existingItem.configurationSnapshot);
      } else if (typeof existingItem.configurationSnapshot?.toJSON === 'function') {
        newConfig = existingItem.configurationSnapshot.toJSON();
      } else {
        newConfig = existingItem.configurationSnapshot || {};
      }
    }
    const newDims = dimensions !== undefined ? dimensions : existingItem.dimensions;

    const itemData = await validateAndPriceItem(
      existingItem.product,
      newConfig,
      newQty,
      newDims,
      existingItem.designType,
      existingItem.artwork,
      existingItem.template
    );

    // Maintain item _id and timestamp while replacing verified content
    cart.items[itemIndex] = {
      ...itemData,
      _id: existingItem._id,
      createdAt: existingItem.createdAt,
    };

    recalculateCartTotal(cart);
    await cart.save();

    await cart.populate('items.product', 'name slug isFeatured');
    return sendSuccess(res, STATUS_CODES.OK, 'Cart item updated and recalculated successfully', { cart });
  } catch (error) {
    if (error.status) {
      return sendError(res, error.status, error.message);
    }
    next(error);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const { query } = resolveSession(req, res);
    const { itemId } = req.params;

    const cart = await Cart.findOne(query);
    if (!cart) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Cart not found.');
    }

    cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
    recalculateCartTotal(cart);
    await cart.save();

    await cart.populate('items.product', 'name slug isFeatured');
    return sendSuccess(res, STATUS_CODES.OK, 'Item removed from cart', { cart });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const { query } = resolveSession(req, res);
    const cart = await Cart.findOne(query);
    if (cart) {
      cart.items = [];
      cart.cartTotal = 0;
      await cart.save();
    }
    return sendSuccess(res, STATUS_CODES.OK, 'Cart cleared successfully', { cart: cart || { items: [], cartTotal: 0 } });
  } catch (error) {
    next(error);
  }
};
