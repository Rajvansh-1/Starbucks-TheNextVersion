import express from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '@/models/User';
import { authenticate, AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';
import { setCache, getCache } from '@/config/redis';

const router = express.Router();

// Mock rewards data - in production, this would come from a Reward model
const mockRewards = [
  {
    _id: '1',
    name: 'Free Coffee',
    description: 'Get a free tall coffee of your choice',
    pointsRequired: 150,
    category: 'beverage',
    image: '/images/rewards/free-coffee.jpg',
    isActive: true,
    expiryDate: null,
  },
  {
    _id: '2',
    name: 'Free Pastry',
    description: 'Get a free pastry with any purchase',
    pointsRequired: 200,
    category: 'food',
    image: '/images/rewards/free-pastry.jpg',
    isActive: true,
    expiryDate: null,
  },
  {
    _id: '3',
    name: 'Free Sandwich',
    description: 'Get a free sandwich of your choice',
    pointsRequired: 300,
    category: 'food',
    image: '/images/rewards/free-sandwich.jpg',
    isActive: true,
    expiryDate: null,
  },
  {
    _id: '4',
    name: 'Free Merchandise',
    description: 'Get a free Starbucks mug or tumbler',
    pointsRequired: 500,
    category: 'merchandise',
    image: '/images/rewards/free-merchandise.jpg',
    isActive: true,
    expiryDate: null,
  },
];

// @desc    Get user rewards status
// @route   GET /api/rewards/status
// @access  Private
router.get('/status', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id).select('rewards');

  res.json({
    success: true,
    data: {
      stars: user!.rewards.stars,
      level: user!.rewards.level,
      totalSpent: user!.rewards.totalSpent,
      joinDate: user!.rewards.joinDate,
      nextLevelThreshold: user!.rewards.level === 'green' ? 300 : null,
      starsToNextLevel: user!.rewards.level === 'green' ? Math.max(0, 300 - user!.rewards.totalSpent) : 0,
    },
  });
}));

// @desc    Get available rewards
// @route   GET /api/rewards/available
// @access  Private
router.get('/available', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id).select('rewards');

  // Check cache first
  const cacheKey = 'rewards:available';
  const cachedRewards = await getCache(cacheKey);

  if (cachedRewards) {
    return res.json({
      success: true,
      data: cachedRewards,
    });
  }

  const availableRewards = mockRewards.filter(reward =>
    reward.isActive && user!.rewards.stars >= reward.pointsRequired
  );

  const result = {
    rewards: availableRewards,
    userStars: user!.rewards.stars,
    totalRewards: availableRewards.length,
  };

  // Cache for 1 hour
  await setCache(cacheKey, result, 3600);

  res.json({
    success: true,
    data: result,
  });
}));

// @desc    Get all rewards
// @route   GET /api/rewards
// @access  Public
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  // Check cache first
  const cacheKey = 'rewards:all';
  const cachedRewards = await getCache(cacheKey);

  if (cachedRewards) {
    return res.json({
      success: true,
      data: cachedRewards,
    });
  }

  const activeRewards = mockRewards.filter(reward => reward.isActive);

  // Cache for 1 hour
  await setCache(cacheKey, activeRewards, 3600);

  res.json({
    success: true,
    data: activeRewards,
  });
}));

// @desc    Redeem reward
// @route   POST /api/rewards/redeem
// @access  Private
router.post('/redeem', authenticate, [
  body('rewardId').notEmpty().withMessage('Reward ID is required'),
  body('storeId').optional().isMongoId().withMessage('Valid store ID is required'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { rewardId, storeId } = req.body;

  const user = await User.findById(req.user!._id).select('rewards');
  const reward = mockRewards.find(r => r._id === rewardId);

  if (!reward) {
    return res.status(404).json({
      success: false,
      message: 'Reward not found',
    });
  }

  if (!reward.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Reward is no longer available',
    });
  }

  if (user!.rewards.stars < reward.pointsRequired) {
    return res.status(400).json({
      success: false,
      message: 'Insufficient stars to redeem this reward',
    });
  }

  // Deduct stars
  user!.rewards.stars -= reward.pointsRequired;
  await user!.save();

  // Generate redemption code
  const redemptionCode = generateRedemptionCode();

  logger.info(`Reward redeemed: ${reward.name} by ${req.user!.email} for ${reward.pointsRequired} stars`);

  res.json({
    success: true,
    message: 'Reward redeemed successfully',
    data: {
      reward: {
        id: reward._id,
        name: reward.name,
        description: reward.description,
        category: reward.category,
      },
      redemptionCode,
      starsRemaining: user!.rewards.stars,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });
}));

// @desc    Get reward history
// @route   GET /api/rewards/history
// @access  Private
router.get('/history', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  // In a real application, this would come from a RewardRedemption model
  const mockHistory = [
    {
      _id: '1',
      reward: {
        id: '1',
        name: 'Free Coffee',
        description: 'Get a free tall coffee of your choice',
        category: 'beverage',
      },
      redeemedAt: new Date('2023-11-01'),
      redemptionCode: 'SB123456',
      status: 'used',
      storeId: '1',
      storeName: 'Starbucks Downtown',
    },
    {
      _id: '2',
      reward: {
        id: '2',
        name: 'Free Pastry',
        description: 'Get a free pastry with any purchase',
        category: 'food',
      },
      redeemedAt: new Date('2023-10-15'),
      redemptionCode: 'SB789012',
      status: 'expired',
      storeId: null,
      storeName: null,
    },
  ];

  res.json({
    success: true,
    data: {
      history: mockHistory,
      total: mockHistory.length,
    },
  });
}));

// @desc    Get rewards tiers
// @route   GET /api/rewards/tiers
// @access  Public
router.get('/tiers', asyncHandler(async (req: Request, res: Response) => {
  // Check cache first
  const cacheKey = 'rewards:tiers';
  const cachedTiers = await getCache(cacheKey);

  if (cachedTiers) {
    return res.json({
      success: true,
      data: cachedTiers,
    });
  }

  const tiers = [
    {
      level: 'green',
      name: 'Green Level',
      description: 'Welcome to Starbucks Rewards! Start earning stars with every purchase.',
      benefits: [
        'Earn 2 stars per $1 spent',
        'Free birthday reward',
        'Free refills on brewed coffee and tea',
        'Mobile order & pay',
      ],
      threshold: 0,
      color: '#00a76f',
    },
    {
      level: 'gold',
      name: 'Gold Level',
      description: 'You\'ve reached Gold status! Enjoy exclusive benefits and rewards.',
      benefits: [
        'Earn 2 stars per $1 spent',
        'Free birthday reward',
        'Free refills on brewed coffee and tea',
        'Mobile order & pay',
        'Exclusive Gold member offers',
        'Free food or drink item every 125 stars',
        'Personalized offers',
      ],
      threshold: 300,
      color: '#cba258',
    },
  ];

  // Cache for 1 hour
  await setCache(cacheKey, tiers, 3600);

  res.json({
    success: true,
    data: tiers,
  });
}));

// Helper function to generate redemption code
function generateRedemptionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SB';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default router;
