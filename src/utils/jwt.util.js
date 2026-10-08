import jwt from 'jsonwebtoken';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET === 'dev_access_secret_key_change_in_prod') {
    throw new Error('ACCESS_TOKEN_SECRET must be set in production');
  }
  if (!process.env.REFRESH_TOKEN_SECRET || process.env.REFRESH_TOKEN_SECRET === 'dev_refresh_secret_key_change_in_prod') {
    throw new Error('REFRESH_TOKEN_SECRET must be set in production');
  }
}

const getAccessSecret = () => process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret_key_change_in_prod';
const getRefreshSecret = () => process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_key_change_in_prod';

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    getAccessSecret(),
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m' }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
    },
    getRefreshSecret(),
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d' }
  );
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, getAccessSecret());
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, getRefreshSecret());
  } catch (error) {
    return null;
  }
};
