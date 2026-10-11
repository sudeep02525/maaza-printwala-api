import Coupon from '../models/Coupon.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';

export const validateCoupon = async (req, res, next) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Coupon code is required.');
    }

    const orderValue = Number(cartTotal) || 0;
    const cleanCode = code.trim().toUpperCase();

    const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });
    if (!coupon) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Invalid or expired coupon code.');
    }

    const now = new Date();
    if (coupon.validFrom && now < new Date(coupon.validFrom)) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Coupon is not yet active.');
    }

    if (coupon.validUntil && now > new Date(coupon.validUntil)) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Coupon code has expired.');
    }

    if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Coupon usage limit has been reached.');
    }

    if (orderValue < (coupon.minOrderValue || 0)) {
      return sendError(
        res,
        STATUS_CODES.BAD_REQUEST,
        `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === 'FLAT') {
      discountAmount = Math.min(coupon.discountValue, orderValue);
    } else if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (orderValue * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalTotal = Math.max(0, Math.round((orderValue - discountAmount) * 100) / 100);

    return sendSuccess(res, STATUS_CODES.OK, 'Coupon applied successfully!', {
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discountAmount,
      finalTotal,
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveCoupons = async (req, res, next) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      $or: [{ validUntil: { $exists: false } }, { validUntil: null }, { validUntil: { $gte: now } }],
    })
      .select('code discountType discountValue minOrderValue maxDiscountAmount validUntil')
      .lean();

    return sendSuccess(res, STATUS_CODES.OK, 'Active coupons fetched successfully', { coupons });
  } catch (error) {
    next(error);
  }
};

export const getAdminCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return sendSuccess(res, STATUS_CODES.OK, 'All coupons fetched successfully', { coupons });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxDiscountAmount, validUntil, usageLimit } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Code, discountType, and discountValue are required.');
    }

    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return sendError(res, STATUS_CODES.CONFLICT, 'Coupon code already exists.');
    }

    const coupon = new Coupon({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      isActive: true,
      isDemoData: false,
    });

    await coupon.save();
    return sendSuccess(res, STATUS_CODES.CREATED, 'Coupon created successfully', { coupon });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
    if (!coupon) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Coupon not found.');
    }
    return sendSuccess(res, STATUS_CODES.OK, 'Coupon updated successfully', { coupon });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Coupon not found.');
    }
    return sendSuccess(res, STATUS_CODES.OK, 'Coupon deleted successfully', { couponId: id });
  } catch (error) {
    next(error);
  }
};
