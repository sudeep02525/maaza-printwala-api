import { sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';


export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : err.status || STATUS_CODES.INTERNAL_SERVER_ERROR;

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${err.message}`, err.stack);
  }

  // Hide internal server error details in production
  let message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    message = 'Internal Server Error';
  }

  return sendError(res, statusCode, message);
};
