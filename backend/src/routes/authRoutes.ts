import express from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '@/models/User';
import { generateToken, generateRefreshToken, verifyRefreshToken, authenticate, AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';
import { setCache, getCache } from '@/config/redis';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = express.Router();

// Email transporter
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('phone').optional().isMobilePhone('en-US').withMessage('Please provide a valid phone number'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { firstName, lastName, email, password, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email',
    });
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
  });

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token in cache
  await setCache(`refresh_token:${user._id}`, refreshToken, 30 * 24 * 60 * 60); // 30 days

  // Send verification email
  const verificationToken = crypto.randomBytes(32).toString('hex');
  await setCache(`verification:${verificationToken}`, user._id, 24 * 60 * 60); // 24 hours

  const verificationUrl = `${process.env.CORS_ORIGIN}/verify-email?token=${verificationToken}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Verify your Starbucks account',
    html: `
      <h2>Welcome to Starbucks!</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `,
  });

  logger.info(`New user registered: ${user.email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email for verification.',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      token,
      refreshToken,
    },
  });
}));

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { email, password } = req.body;

  // Find user and include password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Check if account is active
  if (user.status !== 'active') {
    return res.status(401).json({
      success: false,
      message: 'Account is inactive or suspended',
    });
  }

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token in cache
  await setCache(`refresh_token:${user._id}`, refreshToken, 30 * 24 * 60 * 60); // 30 days

  logger.info(`User logged in: ${user.email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        rewards: user.rewards,
      },
      token,
      refreshToken,
    },
  });
}));

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required',
    });
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }

  // Check if refresh token exists in cache
  const storedToken = await getCache(`refresh_token:${decoded.userId}`);
  if (!storedToken || storedToken !== refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }

  // Generate new tokens
  const newToken = generateToken(decoded.userId);
  const newRefreshToken = generateRefreshToken(decoded.userId);

  // Update refresh token in cache
  await setCache(`refresh_token:${decoded.userId}`, newRefreshToken, 30 * 24 * 60 * 60);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      token: newToken,
      refreshToken: newRefreshToken,
    },
  });
}));

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  // Remove refresh token from cache
  await setCache(`refresh_token:${req.user!._id}`, '', 1);

  logger.info(`User logged out: ${req.user!.email}`);

  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

// @desc    Verify email
// @route   GET /api/auth/verify-email
// @access  Public
router.get('/verify-email', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Verification token is required',
    });
  }

  const userId = await getCache(`verification:${token}`);
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token',
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'User not found',
    });
  }

  user.isEmailVerified = true;
  await user.save();

  // Remove verification token from cache
  await setCache(`verification:${token}`, '', 1);

  logger.info(`Email verified: ${user.email}`);

  res.json({
    success: true,
    message: 'Email verified successfully',
  });
}));

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user!._id,
        firstName: req.user!.firstName,
        lastName: req.user!.lastName,
        email: req.user!.email,
        phone: req.user!.phone,
        role: req.user!.role,
        isEmailVerified: req.user!.isEmailVerified,
        isPhoneVerified: req.user!.isPhoneVerified,
        rewards: req.user!.rewards,
        preferences: req.user!.preferences,
        addresses: req.user!.addresses,
        createdAt: req.user!.createdAt,
      },
    },
  });
}));

export default router;
