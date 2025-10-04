import express from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '@/models/User';
import { authenticate, AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';
import { setCache, getCache } from '@/config/redis';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';

const router = express.Router();

// Mock gift card data - in production, this would come from a GiftCard model
const mockGiftCardDesigns = [
  {
    _id: '1',
    name: 'Classic Green',
    description: 'The iconic Starbucks green design',
    image: '/images/gift-cards/classic-green.jpg',
    isActive: true,
  },
  {
    _id: '2',
    name: 'Holiday Magic',
    description: 'Festive holiday design with snowflakes',
    image: '/images/gift-cards/holiday-magic.jpg',
    isActive: true,
  },
  {
    _id: '3',
    name: 'Coffee Beans',
    description: 'Artistic coffee beans pattern',
    image: '/images/gift-cards/coffee-beans.jpg',
    isActive: true,
  },
  {
    _id: '4',
    name: 'Minimalist',
    description: 'Clean and simple design',
    image: '/images/gift-cards/minimalist.jpg',
    isActive: true,
  },
];

// @desc    Get gift card designs
// @route   GET /api/gift-cards/designs
// @access  Public
router.get('/designs', asyncHandler(async (req: Request, res: Response) => {
  // Check cache first
  const cacheKey = 'gift-cards:designs';
  const cachedDesigns = await getCache(cacheKey);

  if (cachedDesigns) {
    return res.json({
      success: true,
      data: cachedDesigns,
    });
  }

  const activeDesigns = mockGiftCardDesigns.filter(design => design.isActive);

  // Cache for 1 hour
  await setCache(cacheKey, activeDesigns, 3600);

  res.json({
    success: true,
    data: activeDesigns,
  });
}));

// @desc    Create gift card
// @route   POST /api/gift-cards/create
// @access  Private
router.post('/create', authenticate, [
  body('designId').notEmpty().withMessage('Design ID is required'),
  body('amount').isFloat({ min: 5, max: 500 }).withMessage('Amount must be between $5 and $500'),
  body('recipientName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Recipient name must be between 1 and 100 characters'),
  body('recipientEmail').optional().isEmail().withMessage('Valid recipient email is required'),
  body('message').optional().trim().isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters'),
  body('deliveryMethod').isIn(['email', 'sms', 'print']).withMessage('Invalid delivery method'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { designId, amount, recipientName, recipientEmail, message, deliveryMethod } = req.body;

  const design = mockGiftCardDesigns.find(d => d._id === designId);
  if (!design) {
    return res.status(404).json({
      success: false,
      message: 'Gift card design not found',
    });
  }

  // Generate gift card number
  const giftCardNumber = generateGiftCardNumber();
  const pin = generatePIN();

  // Create gift card object
  const giftCard = {
    id: generateGiftCardId(),
    number: giftCardNumber,
    pin: pin,
    amount: parseFloat(amount),
    balance: parseFloat(amount),
    design: design,
    recipientName: recipientName || null,
    recipientEmail: recipientEmail || null,
    message: message || null,
    senderName: `${req.user!.firstName} ${req.user!.lastName}`,
    senderEmail: req.user!.email,
    deliveryMethod,
    status: 'active',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  };

  // Generate QR code
  const qrCodeData = JSON.stringify({
    giftCardNumber,
    pin,
    amount: giftCard.amount,
  });

  const qrCodeImage = await QRCode.toDataURL(qrCodeData);

  logger.info(`Gift card created: ${giftCardNumber} by ${req.user!.email}`);

  res.status(201).json({
    success: true,
    message: 'Gift card created successfully',
    data: {
      giftCard: {
        id: giftCard.id,
        number: giftCard.number,
        amount: giftCard.amount,
        design: giftCard.design,
        recipientName: giftCard.recipientName,
        message: giftCard.message,
        deliveryMethod: giftCard.deliveryMethod,
        expiresAt: giftCard.expiresAt,
      },
      qrCode: qrCodeImage,
    },
  });
}));

// @desc    Get user's gift cards
// @route   GET /api/gift-cards/my-cards
// @access  Private
router.get('/my-cards', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  // In a real application, this would come from a GiftCard model
  const mockUserGiftCards = [
    {
      id: '1',
      number: '1234567890123456',
      amount: 25.00,
      balance: 25.00,
      design: mockGiftCardDesigns[0],
      recipientName: 'John Doe',
      recipientEmail: 'john@example.com',
      message: 'Happy Birthday!',
      status: 'active',
      createdAt: new Date('2023-11-01'),
      expiresAt: new Date('2024-11-01'),
    },
    {
      id: '2',
      number: '2345678901234567',
      amount: 50.00,
      balance: 35.00,
      design: mockGiftCardDesigns[1],
      recipientName: 'Jane Smith',
      recipientEmail: 'jane@example.com',
      message: 'Thank you for everything!',
      status: 'active',
      createdAt: new Date('2023-10-15'),
      expiresAt: new Date('2024-10-15'),
    },
  ];

  res.json({
    success: true,
    data: {
      giftCards: mockUserGiftCards,
      total: mockUserGiftCards.length,
    },
  });
}));

// @desc    Check gift card balance
// @route   POST /api/gift-cards/check-balance
// @access  Public
router.post('/check-balance', [
  body('giftCardNumber').isLength({ min: 16, max: 16 }).withMessage('Gift card number must be 16 digits'),
  body('pin').isLength({ min: 4, max: 4 }).withMessage('PIN must be 4 digits'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { giftCardNumber, pin } = req.body;

  // In a real application, this would query the database
  const mockGiftCard = {
    number: '1234567890123456',
    pin: '1234',
    balance: 25.00,
    status: 'active',
    expiresAt: new Date('2024-11-01'),
  };

  if (giftCardNumber !== mockGiftCard.number || pin !== mockGiftCard.pin) {
    return res.status(400).json({
      success: false,
      message: 'Invalid gift card number or PIN',
    });
  }

  if (mockGiftCard.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Gift card is not active',
    });
  }

  if (new Date() > mockGiftCard.expiresAt) {
    return res.status(400).json({
      success: false,
      message: 'Gift card has expired',
    });
  }

  res.json({
    success: true,
    data: {
      balance: mockGiftCard.balance,
      expiresAt: mockGiftCard.expiresAt,
      status: mockGiftCard.status,
    },
  });
}));

// @desc    Use gift card
// @route   POST /api/gift-cards/use
// @access  Private
router.post('/use', authenticate, [
  body('giftCardNumber').isLength({ min: 16, max: 16 }).withMessage('Gift card number must be 16 digits'),
  body('pin').isLength({ min: 4, max: 4 }).withMessage('PIN must be 4 digits'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { giftCardNumber, pin, amount } = req.body;

  // In a real application, this would query the database and update the balance
  const mockGiftCard = {
    number: '1234567890123456',
    pin: '1234',
    balance: 25.00,
    status: 'active',
    expiresAt: new Date('2024-11-01'),
  };

  if (giftCardNumber !== mockGiftCard.number || pin !== mockGiftCard.pin) {
    return res.status(400).json({
      success: false,
      message: 'Invalid gift card number or PIN',
    });
  }

  if (mockGiftCard.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Gift card is not active',
    });
  }

  if (new Date() > mockGiftCard.expiresAt) {
    return res.status(400).json({
      success: false,
      message: 'Gift card has expired',
    });
  }

  if (parseFloat(amount) > mockGiftCard.balance) {
    return res.status(400).json({
      success: false,
      message: 'Insufficient gift card balance',
    });
  }

  const newBalance = mockGiftCard.balance - parseFloat(amount);

  logger.info(`Gift card used: ${giftCardNumber} for $${amount} by ${req.user!.email}`);

  res.json({
    success: true,
    message: 'Gift card used successfully',
    data: {
      amountUsed: parseFloat(amount),
      remainingBalance: newBalance,
      transactionId: generateTransactionId(),
    },
  });
}));

// @desc    Generate gift card PDF
// @route   POST /api/gift-cards/generate-pdf
// @access  Private
router.post('/generate-pdf', authenticate, [
  body('giftCardId').notEmpty().withMessage('Gift card ID is required'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { giftCardId } = req.body;

  // In a real application, this would fetch the gift card from the database
  const mockGiftCard = {
    id: giftCardId,
    number: '1234567890123456',
    pin: '1234',
    amount: 25.00,
    design: mockGiftCardDesigns[0],
    recipientName: 'John Doe',
    message: 'Happy Birthday!',
    expiresAt: new Date('2024-11-01'),
  };

  // Create PDF
  const doc = new PDFDocument({ size: 'A4' });

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="gift-card-${mockGiftCard.number}.pdf"`);

  // Pipe PDF to response
  doc.pipe(res);

  // Add content to PDF
  doc.fontSize(24).text('Starbucks Gift Card', 50, 50);
  doc.fontSize(16).text(`Gift Card Number: ${mockGiftCard.number}`, 50, 100);
  doc.text(`PIN: ${mockGiftCard.pin}`, 50, 130);
  doc.text(`Amount: $${mockGiftCard.amount}`, 50, 160);
  doc.text(`Recipient: ${mockGiftCard.recipientName}`, 50, 190);
  doc.text(`Message: ${mockGiftCard.message}`, 50, 220);
  doc.text(`Expires: ${mockGiftCard.expiresAt.toLocaleDateString()}`, 50, 250);

  doc.end();

  logger.info(`Gift card PDF generated: ${mockGiftCard.number} by ${req.user!.email}`);
}));

// Helper functions
function generateGiftCardNumber(): string {
  return Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
}

function generatePIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateGiftCardId(): string {
  return 'gc_' + Math.random().toString(36).substr(2, 9);
}

function generateTransactionId(): string {
  return 'txn_' + Math.random().toString(36).substr(2, 9);
}

export default router;
