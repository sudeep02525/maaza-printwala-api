import { verifyAccessToken } from '../utils/jwt.util.js';
import { sendError } from '../utils/response.util.js';
import { STATUS_CODES, ERROR_MESSAGES } from '../constants/error.constants.js';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.TOKEN_EXPIRED);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        const user = await User.findById(decoded.id);
        if (user) req.user = user;
      }
    }
  } catch (error) {
    // Ignore error in optionalAuth
  }
  next();
};
