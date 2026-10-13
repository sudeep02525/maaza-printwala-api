import User from '../models/User.js';
import Address from '../models/Address.js';
import Notification from '../models/Notification.js';
import crypto from 'crypto';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { mergeCartOnLogin } from './cart.controller.js';
import { STATUS_CODES, ERROR_MESSAGES } from '../constants/error.constants.js';


const getCookieNames = (req) => {
  const isAdmin = req.headers['x-client'] === 'admin';
  return {
    access: isAdmin ? 'adminAccessToken' : 'accessToken',
    refresh: isAdmin ? 'adminRefreshToken' : 'refreshToken',
  };
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Please provide name, email, and password');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, STATUS_CODES.CONFLICT, 'Email already registered');
    }

    const user = await User.create({ name, email, password, phone });
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    const { access: accessCookieName, refresh: refreshCookieName } = getCookieNames(req);

    res.cookie(accessCookieName, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie(refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const cartSessionId = req.cookies?.maaza_cart_session || req.headers['x-cart-session-id'];
    if (cartSessionId) {
      await mergeCartOnLogin(user._id, cartSessionId);
    }

    return sendSuccess(res, STATUS_CODES.CREATED, 'User registered successfully', {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Please provide email and password');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    const { access: accessCookieName, refresh: refreshCookieName } = getCookieNames(req);

    res.cookie(accessCookieName, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie(refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const cartSessionId = req.cookies?.maaza_cart_session || req.headers['x-cart-session-id'];
    if (cartSessionId) {
      await mergeCartOnLogin(user._id, cartSessionId);
    }

    return sendSuccess(res, STATUS_CODES.OK, 'Login successful', {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      req.user.refreshToken = undefined;
      await req.user.save();
    }

    const { access: accessCookieName, refresh: refreshCookieName } = getCookieNames(req);
    res.clearCookie(accessCookieName);
    res.clearCookie(refreshCookieName);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return sendSuccess(res, STATUS_CODES.OK, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    return sendSuccess(res, STATUS_CODES.OK, 'Profile fetched successfully', {
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { access: accessCookieName, refresh: refreshCookieName } = getCookieNames(req);
    const refreshToken = req.cookies?.[refreshCookieName] || req.cookies?.refreshToken;
    if (!refreshToken) {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, 'No refresh token provided');
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Invalid refresh token');
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie(accessCookieName, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie(refreshCookieName, newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, STATUS_CODES.OK, 'Token refreshed successfully', {
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Please provide an email address');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return sendSuccess(res, STATUS_CODES.OK, 'If an account exists with that email, a password reset link has been dispatched.');
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save();

    await Notification.create({
      user: user._id,
      recipient: user.email,
      channel: 'EMAIL',
      subject: 'Password Reset Request',
      message: `Password reset token: ${resetToken}. Valid for 30 minutes.`,
      status: 'SENT',
      metadata: { resetToken },
    }).catch((err) => console.error('Notification log error:', err));

    return sendSuccess(res, STATUS_CODES.OK, 'If an account exists with that email, a password reset link has been dispatched.', {
      resetToken,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Reset token and new password are required');
    }

    if (newPassword.length < 6) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Password must be at least 6 characters');
    }

    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Invalid or expired password reset token');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return sendSuccess(res, STATUS_CODES.OK, 'Password reset successfully. You can now log in with your new password.');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Current password and new password are required');
    }

    if (newPassword.length < 6) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'New password must be at least 6 characters');
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await user.comparePassword(currentPassword))) {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, STATUS_CODES.OK, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, companyName, gstin } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'User not found');
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (companyName !== undefined) user.companyName = companyName.trim();
    if (gstin !== undefined) user.gstin = gstin.trim().toUpperCase();

    await user.save();

    return sendSuccess(res, STATUS_CODES.OK, 'Profile updated successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        companyName: user.companyName,
        gstin: user.gstin,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    return sendSuccess(res, STATUS_CODES.OK, 'Addresses fetched successfully', { addresses });
  } catch (error) {
    next(error);
  }
};

export const createAddress = async (req, res, next) => {
  try {
    const { fullName, phone, streetAddress, locality, addressLine2, landmark, city, state, pinCode, gstin, isDefault } = req.body;

    if (!fullName || !phone || !streetAddress || !city || !state || !pinCode) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Please provide all required address fields');
    }

    const count = await Address.countDocuments({ user: req.user._id });
    const shouldBeDefault = Boolean(isDefault) || count === 0;

    if (shouldBeDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user._id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      streetAddress: streetAddress.trim(),
      locality: locality?.trim() || '',
      addressLine2: addressLine2?.trim() || '',
      landmark: landmark?.trim() || '',
      city: city.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      gstin: gstin?.trim()?.toUpperCase() || '',
      isDefault: shouldBeDefault,
    });

    return sendSuccess(res, STATUS_CODES.CREATED, 'Address added successfully', { address });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, phone, streetAddress, locality, addressLine2, landmark, city, state, pinCode, gstin, isDefault } = req.body;

    const address = await Address.findOne({ _id: id, user: req.user._id });
    if (!address) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Address not found');
    }

    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
      address.isDefault = true;
    }

    if (fullName) address.fullName = fullName.trim();
    if (phone) address.phone = phone.trim();
    if (streetAddress) address.streetAddress = streetAddress.trim();
    if (locality !== undefined) address.locality = locality.trim();
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2.trim();
    if (landmark !== undefined) address.landmark = landmark.trim();
    if (city) address.city = city.trim();
    if (state) address.state = state.trim();
    if (pinCode) address.pinCode = pinCode.trim();
    if (gstin !== undefined) address.gstin = gstin.trim().toUpperCase();

    await address.save();

    return sendSuccess(res, STATUS_CODES.OK, 'Address updated successfully', { address });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const address = await Address.findOneAndDelete({ _id: id, user: req.user._id });
    if (!address) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Address not found');
    }

    if (address.isDefault) {
      const remaining = await Address.findOne({ user: req.user._id });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    return sendSuccess(res, STATUS_CODES.OK, 'Address deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Address.updateMany({ user: req.user._id }, { isDefault: false });

    const address = await Address.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { isDefault: true },
      { new: true }
    );

    if (!address) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Address not found');
    }

    return sendSuccess(res, STATUS_CODES.OK, 'Default address updated', { address });
  } catch (error) {
    next(error);
  }
};

