import jwt from 'jsonwebtoken';


export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret_key_change_in_prod',
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m' }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
    },
    process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_key_change_in_prod',
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d' }
  );
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret_key_change_in_prod');
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_key_change_in_prod');
  } catch (error) {
    return null;
  }
};
