import { sendError } from '../utils/response.util.js';
import { STATUS_CODES, ERROR_MESSAGES } from '../constants/error.constants.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, STATUS_CODES.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
    }
    next();
  };
};
