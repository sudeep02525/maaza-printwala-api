import { sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';
import { ENV } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : STATUS_CODES.INTERNAL_SERVER_ERROR;

  if (ENV.NODE_ENV === 'development') {
    console.error(`[Error] ${err.message}`, err.stack);
  }

  return sendError(res, statusCode, err.message || 'Internal Server Error');
};
