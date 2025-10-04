import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Product } from '@/models/Product';
import { authenticate, authorize, AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';
import { setCache, getCache } from '@/config/redis';

const router = express.Router();

// @desc    Get all products with filtering and pagination
// @route   GET /api/products
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['coffee', 'tea', 'food', 'merchandise', 'gift-cards']).withMessage('Invalid category'),
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search term must be between 1 and 100 characters'),
  query('sort').optional().isIn(['name', 'price', 'rating', 'popularity', 'newest']).withMessage('Invalid sort option'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const {
    page = 1,
    limit = 10,
    category,
    search,
    sort = 'popularity',
    order = 'desc',
    minPrice,
    maxPrice,
    dietary,
    isFeatured,
    isNew,
    isSeasonal,
  } = req.query;

  // Build filter object
  const filter: any = { 'availability.isAvailable': true };

  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice as string);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice as string);
  }
  if (dietary) filter.dietaryInfo = { $in: Array.isArray(dietary) ? dietary : [dietary] };
  if (isFeatured === 'true') filter.isFeatured = true;
  if (isNew === 'true') filter.isNew = true;
  if (isSeasonal === 'true') filter.isSeasonal = true;

  // Build search query
  if (search) {
    filter.$text = { $search: search as string };
  }

  // Build sort object
  let sortObj: any = {};
  switch (sort) {
    case 'name':
      sortObj.name = order === 'asc' ? 1 : -1;
      break;
    case 'price':
      sortObj.price = order === 'asc' ? 1 : -1;
      break;
    case 'rating':
      sortObj['popularity.rating'] = order === 'asc' ? 1 : -1;
      break;
    case 'popularity':
      sortObj['popularity.orders'] = order === 'asc' ? 1 : -1;
      break;
    case 'newest':
      sortObj.createdAt = order === 'asc' ? 1 : -1;
      break;
    default:
      sortObj['popularity.orders'] = -1;
  }

  // Check cache first
  const cacheKey = `products:${JSON.stringify({ page, limit, category, search, sort, order, minPrice, maxPrice, dietary, isFeatured, isNew, isSeasonal })}`;
  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return res.json({
      success: true,
      data: cachedData,
    });
  }

  // Calculate pagination
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  // Execute query
  const products = await Product.find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(parseInt(limit as string))
    .populate('availability.stores', 'name address city state');

  const total = await Product.countDocuments(filter);

  const result = {
    products,
    pagination: {
      currentPage: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
      totalProducts: total,
      hasNextPage: skip + parseInt(limit as string) < total,
      hasPrevPage: parseInt(page as string) > 1,
    },
  };

  // Cache the result for 5 minutes
  await setCache(cacheKey, result, 300);

  res.json({
    success: true,
    data: result,
  });
}));

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check cache first
  const cacheKey = `product:${id}`;
  const cachedProduct = await getCache(cacheKey);

  if (cachedProduct) {
    return res.json({
      success: true,
      data: cachedProduct,
    });
  }

  const product = await Product.findById(id).populate('availability.stores', 'name address city state');

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  // Increment view count
  await product.incrementViews();

  // Cache the product for 10 minutes
  await setCache(cacheKey, product, 600);

  res.json({
    success: true,
    data: product,
  });
}));

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
router.get('/featured', asyncHandler(async (req: Request, res: Response) => {
  // Check cache first
  const cacheKey = 'products:featured';
  const cachedProducts = await getCache(cacheKey);

  if (cachedProducts) {
    return res.json({
      success: true,
      data: cachedProducts,
    });
  }

  const products = await Product.find({
    isFeatured: true,
    'availability.isAvailable': true
  })
    .sort({ 'popularity.orders': -1 })
    .limit(8)
    .populate('availability.stores', 'name address city state');

  // Cache for 1 hour
  await setCache(cacheKey, products, 3600);

  res.json({
    success: true,
    data: products,
  });
}));

// @desc    Get new products
// @route   GET /api/products/new
// @access  Public
router.get('/new', asyncHandler(async (req: Request, res: Response) => {
  // Check cache first
  const cacheKey = 'products:new';
  const cachedProducts = await getCache(cacheKey);

  if (cachedProducts) {
    return res.json({
      success: true,
      data: cachedProducts,
    });
  }

  const products = await Product.find({
    isNew: true,
    'availability.isAvailable': true
  })
    .sort({ createdAt: -1 })
    .limit(8)
    .populate('availability.stores', 'name address city state');

  // Cache for 1 hour
  await setCache(cacheKey, products, 3600);

  res.json({
    success: true,
    data: products,
  });
}));

// @desc    Get seasonal products
// @route   GET /api/products/seasonal
// @access  Public
router.get('/seasonal', asyncHandler(async (req: Request, res: Response) => {
  // Check cache first
  const cacheKey = 'products:seasonal';
  const cachedProducts = await getCache(cacheKey);

  if (cachedProducts) {
    return res.json({
      success: true,
      data: cachedProducts,
    });
  }

  const products = await Product.find({
    isSeasonal: true,
    'availability.isAvailable': true
  })
    .sort({ 'popularity.orders': -1 })
    .limit(8)
    .populate('availability.stores', 'name address city state');

  // Cache for 1 hour
  await setCache(cacheKey, products, 3600);

  res.json({
    success: true,
    data: products,
  });
}));

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
router.get('/categories', asyncHandler(async (req: Request, res: Response) => {
  // Check cache first
  const cacheKey = 'products:categories';
  const cachedCategories = await getCache(cacheKey);

  if (cachedCategories) {
    return res.json({
      success: true,
      data: cachedCategories,
    });
  }

  const categories = await Product.aggregate([
    { $match: { 'availability.isAvailable': true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        subcategories: { $addToSet: '$subcategory' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Cache for 1 hour
  await setCache(cacheKey, categories, 3600);

  res.json({
    success: true,
    data: categories,
  });
}));

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Product name is required and must be less than 100 characters'),
  body('description').trim().isLength({ min: 1, max: 1000 }).withMessage('Description is required and must be less than 1000 characters'),
  body('category').isIn(['coffee', 'tea', 'food', 'merchandise', 'gift-cards']).withMessage('Invalid category'),
  body('subcategory').trim().notEmpty().withMessage('Subcategory is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('images').isArray({ min: 1 }).withMessage('At least one image is required'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const product = await Product.create(req.body);

  logger.info(`New product created: ${product.name} by ${req.user!.email}`);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
}));

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
router.put('/:id', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const product = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  // Clear cache
  await setCache(`product:${id}`, '', 1);

  logger.info(`Product updated: ${product.name} by ${req.user!.email}`);

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: product,
  });
}));

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  // Clear cache
  await setCache(`product:${id}`, '', 1);

  logger.info(`Product deleted: ${product.name} by ${req.user!.email}`);

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
}));

export default router;
