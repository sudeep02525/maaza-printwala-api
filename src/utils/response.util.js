export const sendSuccess = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, statusCode = 400, message = 'An error occurred') => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
