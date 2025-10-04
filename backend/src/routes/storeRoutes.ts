import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';
import { setCache, getCache } from '@/config/redis';

const router = express.Router();

// Mock store data - in production, this would come from a Store model
const mockStores = [
  {
    _id: '1',
    name: 'Starbucks Downtown',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    phone: '(555) 123-4567',
    hours: {
      monday: '5:00 AM - 10:00 PM',
      tuesday: '5:00 AM - 10:00 PM',
      wednesday: '5:00 AM - 10:00 PM',
      thursday: '5:00 AM - 10:00 PM',
      friday: '5:00 AM - 11:00 PM',
      saturday: '6:00 AM - 11:00 PM',
      sunday: '6:00 AM - 10:00 PM',
    },
    coordinates: {
      latitude: 40.7589,
      longitude: -73.9851,
    },
    amenities: ['wifi', 'outdoor-seating', 'drive-thru', 'mobile-order'],
    isOpen: true,
  },
  {
    _id: '2',
    name: 'Starbucks Central Park',
    address: '456 Park Ave',
    city: 'New York',
    state: 'NY',
    zipCode: '10022',
    phone: '(555) 234-5678',
    hours: {
      monday: '5:30 AM - 9:30 PM',
      tuesday: '5:30 AM - 9:30 PM',
      wednesday: '5:30 AM - 9:30 PM',
      thursday: '5:30 AM - 9:30 PM',
      friday: '5:30 AM - 10:30 PM',
      saturday: '6:30 AM - 10:30 PM',
      sunday: '6:30 AM - 9:30 PM',
    },
    coordinates: {
      latitude: 40.7829,
      longitude: -73.9654,
    },
    amenities: ['wifi', 'outdoor-seating', 'mobile-order'],
    isOpen: true,
  },
];

// @desc    Get all stores
// @route   GET /api/stores
// @access  Public
router.get('/', [
  query('city').optional().trim().withMessage('City must be a string'),
  query('state').optional().trim().withMessage('State must be a string'),
  query('zipCode').optional().trim().withMessage('Zip code must be a string'),
  query('latitude').optional().isFloat().withMessage('Latitude must be a number'),
  query('longitude').optional().isFloat().withMessage('Longitude must be a number'),
  query('radius').optional().isFloat({ min: 0 }).withMessage('Radius must be a positive number'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { city, state, zipCode, latitude, longitude, radius = 10 } = req.query;

  // Check cache first
  const cacheKey = `stores:${JSON.stringify({ city, state, zipCode, latitude, longitude, radius })}`;
  const cachedStores = await getCache(cacheKey);

  if (cachedStores) {
    return res.json({
      success: true,
      data: cachedStores,
    });
  }

  let filteredStores = [...mockStores];

  // Filter by city
  if (city) {
    filteredStores = filteredStores.filter(store =>
      store.city.toLowerCase().includes((city as string).toLowerCase())
    );
  }

  // Filter by state
  if (state) {
    filteredStores = filteredStores.filter(store =>
      store.state.toLowerCase() === (state as string).toLowerCase()
    );
  }

  // Filter by zip code
  if (zipCode) {
    filteredStores = filteredStores.filter(store =>
      store.zipCode === zipCode
    );
  }

  // Filter by location radius
  if (latitude && longitude) {
    const userLat = parseFloat(latitude as string);
    const userLng = parseFloat(longitude as string);
    const radiusKm = parseFloat(radius as string);

    filteredStores = filteredStores.filter(store => {
      const distance = calculateDistance(
        userLat, userLng,
        store.coordinates.latitude, store.coordinates.longitude
      );
      return distance <= radiusKm;
    });

    // Sort by distance
    filteredStores.sort((a, b) => {
      const distanceA = calculateDistance(
        userLat, userLng,
        a.coordinates.latitude, a.coordinates.longitude
      );
      const distanceB = calculateDistance(
        userLat, userLng,
        b.coordinates.latitude, b.coordinates.longitude
      );
      return distanceA - distanceB;
    });
  }

  const result = {
    stores: filteredStores,
    total: filteredStores.length,
  };

  // Cache for 1 hour
  await setCache(cacheKey, result, 3600);

  res.json({
    success: true,
    data: result,
  });
}));

// @desc    Get single store
// @route   GET /api/stores/:id
// @access  Public
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check cache first
  const cacheKey = `store:${id}`;
  const cachedStore = await getCache(cacheKey);

  if (cachedStore) {
    return res.json({
      success: true,
      data: cachedStore,
    });
  }

  const store = mockStores.find(s => s._id === id);

  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found',
    });
  }

  // Cache for 1 hour
  await setCache(cacheKey, store, 3600);

  res.json({
    success: true,
    data: store,
  });
}));

// @desc    Get store hours
// @route   GET /api/stores/:id/hours
// @access  Public
router.get('/:id/hours', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const store = mockStores.find(s => s._id === id);

  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found',
    });
  }

  res.json({
    success: true,
    data: {
      storeId: store._id,
      storeName: store.name,
      hours: store.hours,
      isOpen: store.isOpen,
    },
  });
}));

// @desc    Get nearby stores
// @route   GET /api/stores/nearby
// @access  Public
router.get('/nearby', [
  query('latitude').isFloat().withMessage('Latitude is required and must be a number'),
  query('longitude').isFloat().withMessage('Longitude is required and must be a number'),
  query('radius').optional().isFloat({ min: 0 }).withMessage('Radius must be a positive number'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { latitude, longitude, radius = 5 } = req.query;
  const userLat = parseFloat(latitude as string);
  const userLng = parseFloat(longitude as string);
  const radiusKm = parseFloat(radius as string);

  // Check cache first
  const cacheKey = `stores:nearby:${userLat}:${userLng}:${radiusKm}`;
  const cachedStores = await getCache(cacheKey);

  if (cachedStores) {
    return res.json({
      success: true,
      data: cachedStores,
    });
  }

  const nearbyStores = mockStores
    .map(store => {
      const distance = calculateDistance(
        userLat, userLng,
        store.coordinates.latitude, store.coordinates.longitude
      );
      return { ...store, distance };
    })
    .filter(store => store.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);

  const result = {
    stores: nearbyStores,
    total: nearbyStores.length,
    userLocation: {
      latitude: userLat,
      longitude: userLng,
    },
    searchRadius: radiusKm,
  };

  // Cache for 30 minutes
  await setCache(cacheKey, result, 1800);

  res.json({
    success: true,
    data: result,
  });
}));

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

export default router;
