import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES, ERROR_MESSAGES } from '../constants/error.constants.js';


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

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
