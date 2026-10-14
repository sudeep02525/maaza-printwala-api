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
  if (!sessionId && process.env.NODE_ENV !== 'production' && req.headers['x-cart-session-id']) {
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

  let schema = await ProductAttributeSchema.findOne({ product: product._id });
  let pricingRule = await PricingRule.findOne({ product: product._id });
  
  if (!schema) {
    schema = {
      product: product._id,
      attributes: [],
      quantityTiers: [100, 250, 500, 1000, 2500],
    };
  }

  if (!pricingRule) {
    pricingRule = {
      product: product._id,
      basePrice: product.basePrice || 200,
      quantityBreaks: [],
      attributeModifiers: [],
      isDemoData: true,
    };
  }

  const configObj = configuration ? { ...configuration } : {};
  schema.attributes.forEach((attr) => {
    const isReq = attr.isRequired || attr.required;
    if (isReq && attr.type !== 'numeric-range' && !configObj[attr.key]) {
      if (attr.options && attr.options.length > 0) {
        configObj[attr.key] = attr.options[0].value;
      } else {
        throw { status: 400, message: `Missing required configuration attribute: ${attr.label || attr.key}` };
      }
    }
    if (attr.options && attr.options.length > 0 && configObj[attr.key]) {
      const validOpt = attr.options.find((o) => String(o.value) === String(configObj[attr.key]));
      if (!validOpt) {
        configObj[attr.key] = attr.options[0].value;
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

  let qty = Number(quantity);
  if (isNaN(qty) || qty < 1) {
    qty = schema.quantityTiers?.[0] || 100;
  }
  if (schema.quantityTiers && schema.quantityTiers.length > 0) {
    const isTier = schema.quantityTiers.includes(qty);
    const minTier = Math.min(...schema.quantityTiers);
    if (!isTier && qty < minTier) {
      qty = minTier;
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
    const allowedKeys = (tmplObj.editableFields || []).flatMap((f) => [f.key, f.label].filter(Boolean));
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
      const val = String(incomingFields[key]);
      if (val.length > 1000) {
        throw { status: 400, message: `Custom field '${key}' exceeds maximum length of 1000 characters.` };
      }
      cleanFields[key] = val;
    });
    authTemplate = {
      templateId: tmplObj._id,
      templateName: tmplObj.name,
      previewUrl: tmplObj.previewUrl || tmplObj.thumbnail || tmplObj.previewFront,
      customFields: cleanFields,
      variantId: template.variantId || null,
      activeSide: template.activeSide || 'front',
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

const areItemsIdentical = (itemA, itemB) => {
  if (String(itemA.product?._id || itemA.product) !== String(itemB.product?._id || itemB.product)) return false;
  if (itemA.designType !== itemB.designType) return false;

  const toObj = (val) => {
    if (!val) return {};
    if (val instanceof Map || typeof val.get === 'function') return Object.fromEntries(val);
    if (typeof val.toJSON === 'function') return val.toJSON();
    return val;
  };

  const configA = JSON.stringify(Object.entries(toObj(itemA.configurationSnapshot)).sort());
  const configB = JSON.stringify(Object.entries(toObj(itemB.configurationSnapshot)).sort());
  if (configA !== configB) return false;

  const dimsA = `${itemA.dimensions?.width || ''}-${itemA.dimensions?.height || ''}-${itemA.dimensions?.unit || ''}`;
  const dimsB = `${itemB.dimensions?.width || ''}-${itemB.dimensions?.height || ''}-${itemB.dimensions?.unit || ''}`;
  if (dimsA !== dimsB) return false;

  if (itemA.designType === 'UPLOAD') {
    if ((itemA.artwork?.fileId || '') !== (itemB.artwork?.fileId || '')) return false;
  } else if (itemA.designType === 'TEMPLATE') {
    if (String(itemA.template?.templateId || '') !== String(itemB.template?.templateId || '')) return false;
    if (String(itemA.template?.variantId || '') !== String(itemB.template?.variantId || '')) return false;
    const fieldsA = JSON.stringify(Object.entries(toObj(itemA.template?.customFields)).sort());
    const fieldsB = JSON.stringify(Object.entries(toObj(itemB.template?.customFields)).sort());
    if (fieldsA !== fieldsB) return false;
  }

  return true;
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

    // Merge identical items with combined quantity
    const existingIndex = cart.items.findIndex((item) => areItemsIdentical(item, itemData));
    if (existingIndex !== -1) {
      const existingItem = cart.items[existingIndex];
      const combinedQty = Number(existingItem.quantity || 0) + Number(itemData.quantity || 0);
      const repricedItem = await validateAndPriceItem(productId, configuration, combinedQty, dimensions, designType, artwork, template);
      cart.items[existingIndex] = repricedItem;
    } else {
      cart.items.push(itemData);
    }

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

export const mergeCartOnLogin = async (userId, sessionId) => {
  if (!sessionId) return;
  const guestCart = await Cart.findOne({ sessionId, user: null });
  if (!guestCart || guestCart.items.length === 0) return;

  let userCart = await Cart.findOne({ user: userId });
  if (!userCart) {
    userCart = new Cart({ user: userId, items: [], cartTotal: 0 });
  }

  // Merge items
  guestCart.items.forEach(item => userCart.items.push(item));
  recalculateCartTotal(userCart);
  await userCart.save();

  // Delete guest cart
  await Cart.deleteOne({ _id: guestCart._id });
};
