import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
router.post('/create-intent', authenticate, [
  body('amount').isFloat({ min: 0.5 }).withMessage('Amount must be at least $0.50'),
  body('currency').optional().isIn(['usd', 'eur', 'gbp']).withMessage('Invalid currency'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { amount, currency = 'usd', metadata = {} } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        userId: req.user!._id.toString(),
        userEmail: req.user!.email,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logger.info(`Payment intent created: ${paymentIntent.id} for user ${req.user!.email}`);

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    logger.error('Payment intent creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Payment intent creation failed',
    });
  }
}));

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
router.post('/confirm', authenticate, [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { paymentIntentId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      logger.info(`Payment confirmed: ${paymentIntentId} for user ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not completed',
        data: {
          status: paymentIntent.status,
        },
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

// @desc    Create customer
// @route   POST /api/payments/create-customer
// @access  Private
router.post('/create-customer', authenticate, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { email, name, phone, address } = req.body;

  try {
    const customer = await stripe.customers.create({
      email,
      name,
      phone,
      address: address ? {
        line1: address.street,
        city: address.city,
        state: address.state,
        postal_code: address.zipCode,
        country: address.country || 'US',
      } : undefined,
      metadata: {
        userId: req.user!._id.toString(),
      },
    });

    logger.info(`Stripe customer created: ${customer.id} for user ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Customer created successfully',
      data: {
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
      },
    });
  } catch (error) {
    logger.error('Customer creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Customer creation failed',
    });
  }
}));

// @desc    Get customer payment methods
// @route   GET /api/payments/payment-methods
// @access  Private
router.get('/payment-methods', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    // Find customer by metadata
    const customers = await stripe.customers.list({
      limit: 1,
      email: req.user!.email,
    });

    if (customers.data.length === 0) {
      return res.json({
        success: true,
        data: {
          paymentMethods: [],
        },
      });
    }

    const customer = customers.data[0];
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card',
    });

    res.json({
      success: true,
      data: {
        customerId: customer.id,
        paymentMethods: paymentMethods.data.map(pm => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          } : null,
        })),
      },
    });
  } catch (error) {
    logger.error('Failed to get payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment methods',
    });
  }
}));

// @desc    Add payment method
// @route   POST /api/payments/payment-methods
// @access  Private
router.post('/payment-methods', authenticate, [
  body('paymentMethodId').notEmpty().withMessage('Payment method ID is required'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { paymentMethodId } = req.body;

  try {
    // Find customer by metadata
    const customers = await stripe.customers.list({
      limit: 1,
      email: req.user!.email,
    });

    let customer;
    if (customers.data.length === 0) {
      // Create customer if doesn't exist
      customer = await stripe.customers.create({
        email: req.user!.email,
        name: `${req.user!.firstName} ${req.user!.lastName}`,
        metadata: {
          userId: req.user!._id.toString(),
        },
      });
    } else {
      customer = customers.data[0];
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    logger.info(`Payment method attached: ${paymentMethodId} for user ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Payment method added successfully',
    });
  } catch (error) {
    logger.error('Failed to add payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add payment method',
    });
  }
}));

// @desc    Remove payment method
// @route   DELETE /api/payments/payment-methods/:paymentMethodId
// @access  Private
router.delete('/payment-methods/:paymentMethodId', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { paymentMethodId } = req.params;

  try {
    await stripe.paymentMethods.detach(paymentMethodId);

    logger.info(`Payment method detached: ${paymentMethodId} for user ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Payment method removed successfully',
    });
  } catch (error) {
    logger.error('Failed to remove payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove payment method',
    });
  }
}));

// @desc    Webhook handler for Stripe events
// @route   POST /api/payments/webhook
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err);
    return res.status(400).send('Webhook Error');
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      logger.info(`Payment succeeded: ${paymentIntent.id}`);
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      logger.error(`Payment failed: ${failedPayment.id}`);
      break;
    default:
      logger.info(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}));

export default router;
