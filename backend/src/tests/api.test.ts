import request from 'supertest';
import app from '../server';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import jwt from 'jsonwebtoken';

describe('Authentication API', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    // Clean up test data
    await User.deleteMany({ email: /test/ });
    await Product.deleteMany({ name: /test/ });
    await Order.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        phone: '+1234567890',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      testUser = response.body.data.user;
      authToken = response.body.data.token;
    });

    it('should fail to register with invalid email', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'invalid-email',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should fail to register with existing email', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists with this email');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should fail to login with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      // Create a test user and get token
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      authToken = registerResponse.body.data.token;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });
  });
});

describe('Products API', () => {
  let authToken: string;
  let testProduct: any;

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    // Clean up test data
    await Product.deleteMany({ name: /test/ });
    await User.deleteMany({ email: /test/ });

    // Create a test user and get token
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = registerResponse.body.data.token;
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Create test products
      const products = [
        {
          name: 'Test Coffee 1',
          description: 'A delicious test coffee',
          category: 'coffee',
          subcategory: 'hot',
          price: 4.99,
          images: ['test-image.jpg'],
          availability: { isAvailable: true, onlineOrder: true },
        },
        {
          name: 'Test Coffee 2',
          description: 'Another delicious test coffee',
          category: 'coffee',
          subcategory: 'iced',
          price: 5.99,
          images: ['test-image2.jpg'],
          availability: { isAvailable: true, onlineOrder: true },
        },
      ];

      for (const product of products) {
        await Product.create(product);
      }
    });

    it('should get all products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.pagination.totalProducts).toBe(2);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products?category=coffee')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
    });

    it('should search products by name', async () => {
      const response = await request(app)
        .get('/api/products?search=Test Coffee 1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Test Coffee 1');
    });
  });

  describe('GET /api/products/:id', () => {
    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Test Coffee',
        description: 'A delicious test coffee',
        category: 'coffee',
        subcategory: 'hot',
        price: 4.99,
        images: ['test-image.jpg'],
        availability: { isAvailable: true, onlineOrder: true },
      });
    });

    it('should get a single product', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Coffee');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/507f1f77bcf86cd799439011')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product (admin only)', async () => {
      const productData = {
        name: 'New Test Coffee',
        description: 'A new test coffee',
        category: 'coffee',
        subcategory: 'hot',
        price: 4.99,
        images: ['new-test-image.jpg'],
        availability: { isAvailable: true, onlineOrder: true },
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Test Coffee');
    });
  });
});

describe('Orders API', () => {
  let authToken: string;
  let testUser: any;
  let testProduct: any;

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    // Clean up test data
    await Order.deleteMany({});
    await Product.deleteMany({ name: /test/ });
    await User.deleteMany({ email: /test/ });

    // Create a test user and get token
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = registerResponse.body.data.token;
    testUser = registerResponse.body.data.user;

    // Create a test product
    testProduct = await Product.create({
      name: 'Test Coffee',
      description: 'A delicious test coffee',
      category: 'coffee',
      subcategory: 'hot',
      price: 4.99,
      images: ['test-image.jpg'],
      availability: { isAvailable: true, onlineOrder: true },
    });
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const orderData = {
        items: [
          {
            product: testProduct._id,
            quantity: 2,
            size: 'grande',
            customizations: {
              milk: 'soy',
              temperature: 'hot',
            },
          },
        ],
        orderType: 'pickup',
        paymentMethod: 'card',
        tip: 1.00,
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orderNumber).toBeDefined();
      expect(response.body.data.total).toBeGreaterThan(0);
    });

    it('should fail to create order with invalid product', async () => {
      const orderData = {
        items: [
          {
            product: '507f1f77bcf86cd799439011', // Non-existent product ID
            quantity: 2,
            size: 'grande',
          },
        ],
        orderType: 'pickup',
        paymentMethod: 'card',
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders', () => {
    beforeEach(async () => {
      // Create a test order
      const orderData = {
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            size: 'grande',
          },
        ],
        orderType: 'pickup',
        paymentMethod: 'card',
      };

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);
    });

    it('should get user orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
    });
  });
});

describe('Error Handling', () => {
  it('should handle 404 errors', async () => {
    const response = await request(app)
      .get('/api/non-existent-route')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('not found');
  });

  it('should handle validation errors', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Test',
        // Missing required fields
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.errors).toBeDefined();
  });
});
