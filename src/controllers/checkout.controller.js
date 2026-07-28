import CheckoutDraft from '../models/CheckoutDraft.js';
import Cart from '../models/Cart.js';
import DeliveryRule from '../models/DeliveryRule.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';
import { resolveSession, validateAndPriceItem, recalculateCartTotal } from './cart.controller.js';

/**
 * Helper to revalidate cart items against server authoritative pricing and schema rules
 */
const revalidateCartAndDraft = async (cart, draft) => {
  let priceChanged = false;
  let invalidCart = false;
  let abortReason = null;
  const newItemsSnapshot = [];

  for (let item of cart.items) {
    try {
      const configObj = item.configurationSnapshot
        ? Object.fromEntries(
            item.configurationSnapshot instanceof Map
              ? item.configurationSnapshot.entries()
              : Object.entries(item.configurationSnapshot)
          )
        : {};

      const templateObj = item.template
        ? {
            templateId: item.template.templateId,
            customFields: item.template.customFields
              ? Object.fromEntries(
                  item.template.customFields instanceof Map
                    ? item.template.customFields.entries()
                    : Object.entries(item.template.customFields)
                )
              : {},
          }
        : undefined;

      const validated = await validateAndPriceItem(
        item.product._id || item.product,
        configObj,
        item.quantity,
        item.dimensions,
        item.designType,
        item.artwork,
        templateObj
      );

      // Check if price changed
      if (
        Math.abs(validated.authoritativeUnitPrice - item.authoritativeUnitPrice) > 0.01 ||
        Math.abs(validated.authoritativeLineTotal - item.authoritativeLineTotal) > 0.01
      ) {
        priceChanged = true;
        item.authoritativeUnitPrice = validated.authoritativeUnitPrice;
        item.authoritativeLineTotal = validated.authoritativeLineTotal;
      }

      const snapshotItem = {
        product: item.product._id || item.product,
        productNameSnapshot: validated.productNameSnapshot || item.productNameSnapshot,
        productImageSnapshot: validated.productImageSnapshot || item.productImageSnapshot,
        configurationSnapshot: configObj,
        dimensions: item.dimensions,
        quantity: item.quantity,
        designType: item.designType,
        authoritativeUnitPrice: validated.authoritativeUnitPrice,
        authoritativeLineTotal: validated.authoritativeLineTotal,
      };
      if (validated.artwork && validated.artwork.fileId) {
        snapshotItem.artwork = validated.artwork;
      }
      if (validated.template && validated.template.templateId) {
        snapshotItem.template = validated.template;
      }
      newItemsSnapshot.push(snapshotItem);
    } catch (err) {
      invalidCart = true;
      abortReason = err.message || 'Product configuration or artwork is no longer valid.';
      break;
    }
  }

  if (invalidCart) {
    draft.status = 'ABORTED_INVALID_CART';
    draft.productionBlockReason = abortReason;
    await draft.save();
    return { success: false, status: 'ABORTED_INVALID_CART', message: abortReason };
  }

  if (priceChanged) {
    recalculateCartTotal(cart);
    await cart.save();
    draft.priceChangeWarning = 'Prices in your cart have been updated according to latest catalog rules.';
    draft.status = 'ABORTED_PRICE_CHANGE';
  } else {
    if (draft.status === 'ABORTED_PRICE_CHANGE' || draft.status === 'ABORTED_INVALID_CART') {
      draft.status = 'IN_PROGRESS';
      draft.priceChangeWarning = null;
    }
  }

  draft.itemsSnapshot = newItemsSnapshot;
  draft.authoritativeSubtotal = cart.items.reduce(
    (acc, it) => acc + (Number(it.authoritativeLineTotal) || 0),
    0
  );
  draft.authoritativeSubtotal = Math.round(draft.authoritativeSubtotal * 100) / 100;

  // Recalculate delivery charge if rule selected
  if (draft.selectedDeliveryRule) {
    const rule = await DeliveryRule.findById(draft.selectedDeliveryRule);
    if (rule && rule.isActive) {
      if (
        rule.freeDeliveryThreshold &&
        draft.authoritativeSubtotal >= rule.freeDeliveryThreshold
      ) {
        draft.deliveryCharge = 0;
      } else {
        draft.deliveryCharge = rule.charge || 0;
      }
      draft.deliveryMethodSnapshot.charge = draft.deliveryCharge;
    }
  }

  // Enforce tax pending status
  draft.taxCalculationStatus = 'NOT_CONFIGURED';
  draft.taxAmount = null;

  // Final total (Subtotal + Delivery Charge, since tax is not configured)
  draft.finalTotalAmount = Math.round((draft.authoritativeSubtotal + (draft.deliveryCharge || 0)) * 100) / 100;

  // Enforce safety guards
  draft.isProductionPaymentReady = false;
  draft.productionBlockReason = 'Pending business configuration: Live online payments will be enabled once merchant onboarding and gateway credential verification are completed.';

  await draft.save();
  return { success: true, draft, priceChanged };
};

/**
 * Get or Initialize Checkout Draft
 */
export const getOrInitDraft = async (req, res, next) => {
  try {
    const { query, sessionId } = resolveSession(req, res);
    const cart = await Cart.findOne(query).populate('items.product', 'name slug isFeatured images');

    if (!cart || !cart.items || cart.items.length === 0) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Cart is empty. Please add products before checking out.');
    }

    let draftQuery = {};
    if (req.user && req.user._id) {
      draftQuery.user = req.user._id;
    } else {
      draftQuery.sessionId = sessionId;
    }

    let draft = await CheckoutDraft.findOne({
      ...draftQuery,
      cart: cart._id,
      status: { $ne: 'EXPIRED' },
    });

    if (!draft) {
      const draftNumber = `CHK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      draft = new CheckoutDraft({
        draftNumber,
        sessionId: req.user ? undefined : sessionId,
        user: req.user ? req.user._id : undefined,
        cart: cart._id,
        authoritativeSubtotal: cart.cartTotal || 0,
        taxCalculationStatus: 'NOT_CONFIGURED',
        taxAmount: null,
        isProductionPaymentReady: false,
      });
      await draft.save();
    }

    const reval = await revalidateCartAndDraft(cart, draft);
    if (!reval.success) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, reval.message, { draft });
    }

    return sendSuccess(res, STATUS_CODES.OK, 'Checkout draft loaded successfully', {
      draft: reval.draft || draft,
      priceChanged: reval.priceChanged,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Available Delivery Methods (Demo Rules) for PIN code
 */
export const getDeliveryMethods = async (req, res, next) => {
  try {
    const { pinCode } = req.query;
    if (!pinCode || !/^[1-9][0-9]{5}$/.test(pinCode)) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Invalid Indian PIN code format.');
    }

    const allRules = await DeliveryRule.find({ isActive: true });
    const eligibleRules = allRules.filter((rule) => {
      if (!rule.pinCodePrefixes || rule.pinCodePrefixes.length === 0) return false;
      if (rule.pinCodePrefixes.includes('*')) return true;
      return rule.pinCodePrefixes.some((pref) => pinCode.startsWith(pref));
    });

    return sendSuccess(res, STATUS_CODES.OK, 'Delivery methods fetched successfully', {
      deliveryMethods: eligibleRules,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Contact Details
 */
export const updateContact = async (req, res, next) => {
  try {
    const { draftId, fullName, email, phone } = req.body;
    if (!draftId) return sendError(res, STATUS_CODES.BAD_REQUEST, 'Draft ID is required.');
    if (!fullName || !fullName.trim()) return sendError(res, STATUS_CODES.BAD_REQUEST, 'Full Name is required.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Valid email address is required.');
    }
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Valid 10-digit Indian mobile number is required.');
    }

    const { query, sessionId } = resolveSession(req, res);
    let draftQuery = { _id: draftId };
    if (req.user && req.user._id) draftQuery.user = req.user._id;
    else draftQuery.sessionId = sessionId;

    const draft = await CheckoutDraft.findOne(draftQuery);
    if (!draft) return sendError(res, STATUS_CODES.NOT_FOUND, 'Checkout draft not found or unauthorized.');

    draft.contactDetails = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
    };
    await draft.save();

    return sendSuccess(res, STATUS_CODES.OK, 'Contact details updated successfully', { draft });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Delivery Address (Structured Indian Address with manual City/State)
 */
export const updateAddress = async (req, res, next) => {
  try {
    const { draftId, fullName, phone, streetAddress, addressLine2, landmark, city, state, pinCode } = req.body;
    if (!draftId) return sendError(res, STATUS_CODES.BAD_REQUEST, 'Draft ID is required.');
    if (!fullName || !fullName.trim()) return sendError(res, STATUS_CODES.BAD_REQUEST, 'Full Name is required.');
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) return sendError(res, STATUS_CODES.BAD_REQUEST, 'Valid 10-digit phone is required.');
    if (!streetAddress || !streetAddress.trim()) return sendError(res, STATUS_CODES.BAD_REQUEST, 'Street address is required.');
    if (!city || !city.trim()) return sendError(res, STATUS_CODES.BAD_REQUEST, 'City is required.');
    if (!state || !state.trim()) return sendError(res, STATUS_CODES.BAD_REQUEST, 'State is required.');
    if (!pinCode || !/^[1-9][0-9]{5}$/.test(pinCode)) return sendError(res, STATUS_CODES.BAD_REQUEST, 'Valid 6-digit Indian PIN code is required.');

    const { query, sessionId } = resolveSession(req, res);
    let draftQuery = { _id: draftId };
    if (req.user && req.user._id) draftQuery.user = req.user._id;
    else draftQuery.sessionId = sessionId;

    const draft = await CheckoutDraft.findOne(draftQuery);
    if (!draft) return sendError(res, STATUS_CODES.NOT_FOUND, 'Checkout draft not found or unauthorized.');

    draft.deliveryAddress = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      streetAddress: streetAddress.trim(),
      addressLine2: addressLine2 ? addressLine2.trim() : undefined,
      landmark: landmark ? landmark.trim() : undefined,
      city: city.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      country: 'India',
    };

    // If selected delivery rule no longer matches PIN code, unset it
    if (draft.selectedDeliveryRule) {
      const rule = await DeliveryRule.findById(draft.selectedDeliveryRule);
      if (!rule || !rule.isActive || (!rule.pinCodePrefixes.includes('*') && !rule.pinCodePrefixes.some(p => pinCode.startsWith(p)))) {
        draft.selectedDeliveryRule = undefined;
        draft.deliveryMethodSnapshot = undefined;
        draft.deliveryCharge = 0;
      }
    }

    draft.finalTotalAmount = Math.round((draft.authoritativeSubtotal + (draft.deliveryCharge || 0)) * 100) / 100;
    await draft.save();

    return sendSuccess(res, STATUS_CODES.OK, 'Delivery address updated successfully', { draft });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Billing Details & GST
 */
export const updateBilling = async (req, res, next) => {
  try {
    const { draftId, sameAsDelivery, address, isBusinessPurchase, companyName, gstin, purchaseOrderNumber } = req.body;
    if (!draftId) return sendError(res, STATUS_CODES.BAD_REQUEST, 'Draft ID is required.');

    if (isBusinessPurchase === true && gstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(gstin.trim().toUpperCase())) {
        return sendError(res, STATUS_CODES.BAD_REQUEST, 'Invalid Indian GSTIN structure.');
      }
    }

    const { query, sessionId } = resolveSession(req, res);
    let draftQuery = { _id: draftId };
    if (req.user && req.user._id) draftQuery.user = req.user._id;
    else draftQuery.sessionId = sessionId;

    const draft = await CheckoutDraft.findOne(draftQuery);
    if (!draft) return sendError(res, STATUS_CODES.NOT_FOUND, 'Checkout draft not found or unauthorized.');

    let billingAddr = draft.deliveryAddress;
    if (sameAsDelivery === false && address) {
      if (!address.fullName || !address.streetAddress || !address.city || !address.state || !/^[1-9][0-9]{5}$/.test(address.pinCode)) {
        return sendError(res, STATUS_CODES.BAD_REQUEST, 'Incomplete or invalid separate billing address.');
      }
      billingAddr = {
        fullName: address.fullName.trim(),
        phone: address.phone?.trim() || '',
        streetAddress: address.streetAddress.trim(),
        addressLine2: address.addressLine2?.trim() || '',
        landmark: address.landmark?.trim() || '',
        city: address.city.trim(),
        state: address.state.trim(),
        pinCode: address.pinCode.trim(),
        country: 'India',
      };
    }

    draft.billingDetails = {
      sameAsDelivery: sameAsDelivery !== false,
      address: billingAddr,
      isBusinessPurchase: isBusinessPurchase === true,
      companyName: companyName ? companyName.trim() : undefined,
      gstin: gstin ? gstin.trim().toUpperCase() : undefined,
      purchaseOrderNumber: purchaseOrderNumber ? purchaseOrderNumber.trim() : undefined,
    };

    await draft.save();
    return sendSuccess(res, STATUS_CODES.OK, 'Billing details updated successfully', { draft });
  } catch (error) {
    next(error);
  }
};

/**
 * Select Delivery Method (Server-Authoritative Calculation)
 */
export const selectDeliveryRule = async (req, res, next) => {
  try {
    const { draftId, deliveryRuleId } = req.body;
    if (!draftId || !deliveryRuleId) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Draft ID and Delivery Rule ID are required.');
    }

    const { query, sessionId } = resolveSession(req, res);
    let draftQuery = { _id: draftId };
    if (req.user && req.user._id) draftQuery.user = req.user._id;
    else draftQuery.sessionId = sessionId;

    const draft = await CheckoutDraft.findOne(draftQuery);
    if (!draft) return sendError(res, STATUS_CODES.NOT_FOUND, 'Checkout draft not found or unauthorized.');
    if (!draft.deliveryAddress || !draft.deliveryAddress.pinCode) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Delivery address PIN code is required before selecting delivery method.');
    }

    const rule = await DeliveryRule.findById(deliveryRuleId);
    if (!rule || !rule.isActive) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Selected delivery method is invalid or inactive.');
    }

    // Verify PIN prefix serviceability
    const pin = draft.deliveryAddress.pinCode;
    const matches = rule.pinCodePrefixes.includes('*') || rule.pinCodePrefixes.some(p => pin.startsWith(p));
    if (!matches) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Selected delivery method is not serviceable for your PIN code.');
    }

    // Server-Authoritative Charge Calculation
    let charge = rule.charge || 0;
    if (rule.freeDeliveryThreshold && draft.authoritativeSubtotal >= rule.freeDeliveryThreshold) {
      charge = 0;
    }

    draft.selectedDeliveryRule = rule._id;
    draft.deliveryCharge = charge;
    draft.deliveryMethodSnapshot = {
      name: rule.name,
      deliveryMethod: rule.deliveryMethod,
      charge: charge,
      estimatedDaysMin: rule.estimatedDaysMin,
      estimatedDaysMax: rule.estimatedDaysMax,
      isDemoData: true, // Strictly badged as demo rule
    };

    draft.finalTotalAmount = Math.round((draft.authoritativeSubtotal + charge) * 100) / 100;
    await draft.save();

    return sendSuccess(res, STATUS_CODES.OK, 'Delivery method applied successfully', { draft });
  } catch (error) {
    next(error);
  }
};

/**
 * Revalidate and Transition to READY_FOR_PAYMENT
 */
export const reviewAndPreparePayment = async (req, res, next) => {
  try {
    const { draftId } = req.body;
    if (!draftId) return sendError(res, STATUS_CODES.BAD_REQUEST, 'Draft ID is required.');

    const { query, sessionId } = resolveSession(req, res);
    let draftQuery = { _id: draftId };
    if (req.user && req.user._id) draftQuery.user = req.user._id;
    else draftQuery.sessionId = sessionId;

    const draft = await CheckoutDraft.findOne(draftQuery);
    if (!draft) return sendError(res, STATUS_CODES.NOT_FOUND, 'Checkout draft not found or unauthorized.');

    const cart = await Cart.findById(draft.cart).populate('items.product', 'name slug isFeatured images');
    if (!cart || !cart.items || cart.items.length === 0) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Cart is empty or no longer exists.');
    }

    const reval = await revalidateCartAndDraft(cart, draft);
    if (!reval.success) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, reval.message, { draft });
    }
    if (reval.priceChanged) {
      return sendError(res, STATUS_CODES.CONFLICT, 'Cart prices have changed. Please review updated totals.', { draft });
    }

    // Check completion of steps
    if (!draft.contactDetails || !draft.contactDetails.fullName || !draft.contactDetails.phone || !draft.contactDetails.email) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Contact details are incomplete.');
    }
    if (!draft.deliveryAddress || !draft.deliveryAddress.streetAddress || !draft.deliveryAddress.pinCode || !draft.deliveryAddress.city || !draft.deliveryAddress.state) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Delivery address is incomplete.');
    }
    if (!draft.selectedDeliveryRule || !draft.deliveryMethodSnapshot) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Please select a delivery method.');
    }

    // Transition to READY_FOR_PAYMENT
    draft.status = 'READY_FOR_PAYMENT';
    draft.isProductionPaymentReady = false; // MUST REMAIN FALSE
    draft.productionBlockReason = 'Pending business configuration: Live online payments will be enabled once merchant onboarding and gateway credential verification are completed.';
    await draft.save();

    return sendSuccess(res, STATUS_CODES.OK, 'Checkout validated and ready for payment phase', { draft });
  } catch (error) {
    next(error);
  }
};
