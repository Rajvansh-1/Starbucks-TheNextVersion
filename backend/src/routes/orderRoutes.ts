import express from 'express';
import { body, validationResult } from 'express-validator';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { User } from '@/models/User';
import { authenticate, AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', authenticate, [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.size').isIn(['tall', 'grande', 'venti', 'trenta', 'one-size']).withMessage('Invalid size'),
  body('orderType').isIn(['pickup', 'delivery', 'dine-in']).withMessage('Invalid order type'),
  body('paymentMethod').isIn(['card', 'cash', 'rewards', 'gift-card']).withMessage('Invalid payment method'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { items, store, orderType, paymentMethod, deliveryAddress, tip = 0, notes } = req.body;

  // Validate products and calculate prices
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(400).json({
        success: false,
        message: `Product with ID ${item.product} not found`,
      });
    }

    if (!product.availability.isAvailable) {
      return res.status(400).json({
        success: false,
        message: `Product ${product.name} is not available`,
      });
    }

    const itemPrice = product.price;
    const totalPrice = itemPrice * item.quantity;
    subtotal += totalPrice;

    validatedItems.push({
      product: product._id,
      quantity: item.quantity,
      size: item.size,
      customizations: item.customizations || {},
      price: itemPrice,
      totalPrice,
    });
  }

  // Calculate tax (assuming 8.5% tax rate)
  const taxRate = 0.085;
  const tax = subtotal * taxRate;

  // Calculate delivery fee
  let deliveryFee = 0;
  if (orderType === 'delivery') {
    deliveryFee = 3.99; // Standard delivery fee
  }

  // Calculate rewards
  const rewardsEarned = Math.floor(subtotal * 0.02); // 2 stars per dollar
  const rewardsUsed = req.body.rewardsUsed || 0;

  // Calculate total
  const total = subtotal + tax + tip + deliveryFee - rewardsUsed;

  // Create order
  const order = await Order.create({
    user: req.user!._id,
    items: validatedItems,
    store,
    orderType,
    paymentMethod,
    subtotal,
    tax,
    tip,
    deliveryFee,
    total,
    rewardsEarned,
    rewardsUsed,
    deliveryAddress,
    notes,
  });

  // Calculate estimated ready time
  await order.calculateEstimatedReadyTime();

  // Update user rewards
  const user = await User.findById(req.user!._id);
  if (user) {
    user.rewards.stars += rewardsEarned;
    user.rewards.stars -= rewardsUsed;
    user.rewards.totalSpent += subtotal;
    user.updateRewardsLevel();
    await user.save();
  }

  // Update product popularity
  for (const item of validatedItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { 'popularity.orders': item.quantity },
    });
  }

  logger.info(`New order created: ${order.orderNumber} by ${req.user!.email}`);

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order,
  });
}));

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, status } = req.query;

  const filter: any = { user: req.user!._id };
  if (status) filter.status = status;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const orders = await Order.find(filter)
    .populate('items.product', 'name images price')
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

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const order = await Order.findOne({ _id: id, user: req.user!._id })
    .populate('items.product', 'name images price nutritionalInfo ingredients')
    .populate('store', 'name address city state phone hours');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  res.json({
    success: true,
    data: order,
  });
}));

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Admin/Staff)
router.patch('/:id/status', authenticate, [
  body('status').isIn(['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']).withMessage('Invalid status'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  // Check if user has permission to update order status
  if (req.user!.role !== 'admin' && req.user!.role !== 'staff') {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions',
    });
  }

  await order.updateStatus(status);

  logger.info(`Order ${order.orderNumber} status updated to ${status} by ${req.user!.email}`);

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: order,
  });
}));

// @desc    Cancel order
// @route   PATCH /api/orders/:id/cancel
// @access  Private
router.patch('/:id/cancel', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const order = await Order.findOne({ _id: id, user: req.user!._id });
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  // Check if order can be cancelled
  if (['completed', 'cancelled'].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be cancelled',
    });
  }

  order.status = 'cancelled';
  await order.save();

  // Refund rewards if used
  if (order.rewardsUsed > 0) {
    const user = await User.findById(req.user!._id);
    if (user) {
      user.rewards.stars += order.rewardsUsed;
      await user.save();
    }
  }

  logger.info(`Order ${order.orderNumber} cancelled by ${req.user!.email}`);

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: order,
  });
}));

// @desc    Create payment intent
// @route   POST /api/orders/:id/payment-intent
// @access  Private
router.post('/:id/payment-intent', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const order = await Order.findOne({ _id: id, user: req.user!._id });
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  if (order.paymentStatus === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Order already paid',
    });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: req.user!._id.toString(),
      },
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    logger.error('Stripe payment intent creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Payment intent creation failed',
    });
  }
}));

// @desc    Confirm payment
// @route   POST /api/orders/:id/confirm-payment
// @access  Private
router.post('/:id/confirm-payment', authenticate, [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { paymentIntentId } = req.body;

  const order = await Order.findOne({ _id: id, user: req.user!._id });
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      await order.save();

      logger.info(`Payment confirmed for order ${order.orderNumber}`);

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: order,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not completed',
      });
    }
  } catch (error) {
    logger.error('Payment confirmation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Payment confirmation failed',
    });
  }
}));

export default router;
