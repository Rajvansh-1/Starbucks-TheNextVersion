import express from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '@/models/User';
import { authenticate, AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';
import { setCache, getCache } from '@/config/redis';

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id)
    .populate('preferences.favoriteStores', 'name address city state');

  res.json({
    success: true,
    data: user,
  });
}));

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', authenticate, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('phone').optional().isMobilePhone('en-US').withMessage('Please provide a valid phone number'),
  body('dateOfBirth').optional().isISO8601().withMessage('Please provide a valid date'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const allowedUpdates = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'profileImage'];
  const updates = Object.keys(req.body).filter(key => allowedUpdates.includes(key));

  const updateData: any = {};
  updates.forEach(update => {
    updateData[update] = req.body[update];
  });

  const user = await User.findByIdAndUpdate(req.user!._id, updateData, {
    new: true,
    runValidators: true,
  });

  logger.info(`User profile updated: ${user!.email}`);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
}));

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
router.put('/preferences', authenticate, [
  body('notifications.email').optional().isBoolean().withMessage('Email notification preference must be boolean'),
  body('notifications.sms').optional().isBoolean().withMessage('SMS notification preference must be boolean'),
  body('notifications.push').optional().isBoolean().withMessage('Push notification preference must be boolean'),
  body('dietaryRestrictions').optional().isArray().withMessage('Dietary restrictions must be an array'),
  body('favoriteStores').optional().isArray().withMessage('Favorite stores must be an array'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { notifications, dietaryRestrictions, favoriteStores } = req.body;

  const updateData: any = {};

  if (notifications) {
    updateData['preferences.notifications'] = notifications;
  }

  if (dietaryRestrictions) {
    updateData['preferences.dietaryRestrictions'] = dietaryRestrictions;
  }

  if (favoriteStores) {
    updateData['preferences.favoriteStores'] = favoriteStores;
  }

  const user = await User.findByIdAndUpdate(req.user!._id, updateData, {
    new: true,
    runValidators: true,
  });

  logger.info(`User preferences updated: ${user!.email}`);

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: user!.preferences,
  });
}));

// @desc    Add address
// @route   POST /api/users/addresses
// @access  Private
router.post('/addresses', authenticate, [
  body('type').isIn(['home', 'work', 'other']).withMessage('Invalid address type'),
  body('street').trim().notEmpty().withMessage('Street address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('zipCode').trim().notEmpty().withMessage('Zip code is required'),
  body('country').optional().trim().withMessage('Country is optional'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { type, street, city, state, zipCode, country = 'United States', isDefault = false } = req.body;

  // If this is set as default, unset other defaults
  if (isDefault) {
    await User.updateOne(
      { _id: req.user!._id, 'addresses.isDefault': true },
      { $set: { 'addresses.$.isDefault': false } }
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user!._id,
    {
      $push: {
        addresses: {
          type,
          street,
          city,
          state,
          zipCode,
          country,
          isDefault,
        },
      },
    },
    { new: true }
  );

  logger.info(`Address added for user: ${user!.email}`);

  res.json({
    success: true,
    message: 'Address added successfully',
    data: user!.addresses,
  });
}));

// @desc    Update address
// @route   PUT /api/users/addresses/:addressId
// @access  Private
router.put('/addresses/:addressId', authenticate, [
  body('type').optional().isIn(['home', 'work', 'other']).withMessage('Invalid address type'),
  body('street').optional().trim().notEmpty().withMessage('Street address cannot be empty'),
  body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('state').optional().trim().notEmpty().withMessage('State cannot be empty'),
  body('zipCode').optional().trim().notEmpty().withMessage('Zip code cannot be empty'),
  body('country').optional().trim().withMessage('Country is optional'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { addressId } = req.params;
  const updates = req.body;

  // If this is set as default, unset other defaults
  if (updates.isDefault) {
    await User.updateOne(
      { _id: req.user!._id, 'addresses.isDefault': true },
      { $set: { 'addresses.$.isDefault': false } }
    );
  }

  const updateFields: any = {};
  Object.keys(updates).forEach(key => {
    updateFields[`addresses.$.${key}`] = updates[key];
  });

  const user = await User.updateOne(
    { _id: req.user!._id, 'addresses._id': addressId },
    { $set: updateFields },
    { new: true }
  );

  if (user.matchedCount === 0) {
    return res.status(404).json({
      success: false,
      message: 'Address not found',
    });
  }

  logger.info(`Address updated for user: ${req.user!.email}`);

  res.json({
    success: true,
    message: 'Address updated successfully',
  });
}));

// @desc    Delete address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
router.delete('/addresses/:addressId', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { addressId } = req.params;

  const user = await User.updateOne(
    { _id: req.user!._id },
    { $pull: { addresses: { _id: addressId } } }
  );

  if (user.matchedCount === 0) {
    return res.status(404).json({
      success: false,
      message: 'Address not found',
    });
  }

  logger.info(`Address deleted for user: ${req.user!.email}`);

  res.json({
    success: true,
    message: 'Address deleted successfully',
  });
}));

// @desc    Get user rewards
// @route   GET /api/users/rewards
// @access  Private
router.get('/rewards', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id).select('rewards');

  res.json({
    success: true,
    data: user!.rewards,
  });
}));

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user!._id).select('+password');

  const isCurrentPasswordValid = await user!.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  user!.password = newPassword;
  await user!.save();

  logger.info(`Password changed for user: ${user!.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

export default router;
