import express from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '@/models/User';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';
import { authenticate, authorize, AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';
import { setCache, getCache, clearCachePattern } from '@/config/redis';

const router = express.Router();

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get('/dashboard', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  // Check cache first
  const cacheKey = 'admin:dashboard:stats';
  const cachedStats = await getCache(cacheKey);

  if (cachedStats) {
    return res.json({
      success: true,
      data: cachedStats,
    });
  }

  // Get statistics
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    recentOrders,
    topProducts,
    userGrowth,
  ] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.find().sort({ createdAt: -1 }).limit(10).populate('user', 'firstName lastName email'),
    Product.find().sort({ 'popularity.orders': -1 }).limit(5),
    User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]),
  ]);

  // Calculate revenue
  const revenueData = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
      },
    },
  ]);

  const stats = {
    overview: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: revenueData[0]?.totalRevenue || 0,
      averageOrderValue: revenueData[0]?.averageOrderValue || 0,
    },
    recentOrders,
    topProducts,
    userGrowth,
  };

  // Cache for 5 minutes
  await setCache(cacheKey, stats, 300);

  res.json({
    success: true,
    data: stats,
  });
}));

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search, status, role } = req.query;

  const filter: any = {};
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (status) filter.status = status;
  if (role) filter.role = role;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit as string));

  const total = await User.countDocuments(filter);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
        totalUsers: total,
        hasNextPage: skip + parseInt(limit as string) < total,
        hasPrevPage: parseInt(page as string) > 1,
      },
    },
  });
}));

// @desc    Update user status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin only)
router.patch('/users/:id/status', authenticate, authorize('admin'), [
  body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  const { status } = req.body;

  const user = await User.findByIdAndUpdate(id, { status }, { new: true });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  logger.info(`User status updated: ${user.email} to ${status} by ${req.user!.email}`);

  res.json({
    success: true,
    message: 'User status updated successfully',
    data: user,
  });
}));

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private (Admin only)
router.get('/orders', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, status, paymentStatus, orderType } = req.query;

  const filter: any = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (orderType) filter.orderType = orderType;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const orders = await Order.find(filter)
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'name price')
    .populate('store', 'name address city state')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit as string));

  const total = await Order.countDocuments(filter);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
        totalOrders: total,
        hasNextPage: skip + parseInt(limit as string) < total,
        hasPrevPage: parseInt(page as string) > 1,
      },
    },
  });
}));

// @desc    Update order status
// @route   PATCH /api/admin/orders/:id/status
// @access  Private (Admin only)
router.patch('/orders/:id/status', authenticate, authorize('admin'), [
  body('status').isIn(['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']).withMessage('Invalid status'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  const { status } = req.body;

  const order = await Order.findByIdAndUpdate(id, { status }, { new: true })
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'name price');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  logger.info(`Order status updated: ${order.orderNumber} to ${status} by ${req.user!.email}`);

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: order,
  });
}));

// @desc    Get product analytics
// @route   GET /api/admin/products/analytics
// @access  Private (Admin only)
router.get('/products/analytics', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  // Check cache first
  const cacheKey = 'admin:products:analytics';
  const cachedAnalytics = await getCache(cacheKey);

  if (cachedAnalytics) {
    return res.json({
      success: true,
      data: cachedAnalytics,
    });
  }

  const [
    totalProducts,
    availableProducts,
    featuredProducts,
    newProducts,
    topSellingProducts,
    categoryStats,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ 'availability.isAvailable': true }),
    Product.countDocuments({ isFeatured: true }),
    Product.countDocuments({ isNew: true }),
    Product.find().sort({ 'popularity.orders': -1 }).limit(10),
    Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalOrders: { $sum: '$popularity.orders' },
        },
      },
      { $sort: { totalOrders: -1 } },
    ]),
  ]);

  const analytics = {
    overview: {
      totalProducts,
      availableProducts,
      featuredProducts,
      newProducts,
    },
    topSellingProducts,
    categoryStats,
  };

  // Cache for 10 minutes
  await setCache(cacheKey, analytics, 600);

  res.json({
    success: true,
    data: analytics,
  });
}));

// @desc    Clear cache
// @route   POST /api/admin/cache/clear
// @access  Private (Admin only)
router.post('/cache/clear', authenticate, authorize('admin'), [
  body('pattern').optional().isString().withMessage('Pattern must be a string'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const { pattern = '*' } = req.body;

  try {
    if (pattern === '*') {
      // Clear all cache
      await clearCachePattern('*');
    } else {
      // Clear specific pattern
      await clearCachePattern(pattern);
    }

    logger.info(`Cache cleared with pattern: ${pattern} by ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    logger.error('Cache clear failed:', error);
    res.status(500).json({
      success: false,
      message: 'Cache clear failed',
    });
  }
}));

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private (Admin only)
router.get('/logs', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 50, level, startDate, endDate } = req.query;

  // In a real application, this would query log files or a logging database
  const mockLogs = [
    {
      timestamp: new Date('2023-11-15T10:30:00Z'),
      level: 'info',
      message: 'User logged in successfully',
      userId: 'user123',
      ip: '192.168.1.1',
    },
    {
      timestamp: new Date('2023-11-15T10:25:00Z'),
      level: 'error',
      message: 'Payment processing failed',
      userId: 'user456',
      ip: '192.168.1.2',
    },
    {
      timestamp: new Date('2023-11-15T10:20:00Z'),
      level: 'warn',
      message: 'High memory usage detected',
      userId: null,
      ip: null,
    },
  ];

  res.json({
    success: true,
    data: {
      logs: mockLogs,
      total: mockLogs.length,
    },
  });
}));

export default router;
