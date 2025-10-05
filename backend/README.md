# Starbucks The Next Version - Backend API

A robust, industry-grade backend API for the Starbucks The Next Version application, built with Node.js, Express, TypeScript, MongoDB, and Redis.

## 🚀 Features

### Core Features
- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **User Management**: Complete user profiles, preferences, and addresses
- **Product Catalog**: Comprehensive product management with categories, customization options
- **Order Management**: Full order lifecycle with real-time status updates
- **Payment Integration**: Stripe payment processing with webhooks
- **Rewards System**: Points-based rewards with tier management
- **Gift Cards**: Digital gift card creation and management
- **Store Locator**: Store information and location services
- **Admin Dashboard**: Comprehensive admin panel with analytics

### Technical Features
- **Real-time Communication**: Socket.io for live updates
- **Caching**: Redis-based caching for performance optimization
- **Image Upload**: Cloudinary integration for media management
- **Email Service**: Automated email notifications
- **Rate Limiting**: API rate limiting for security
- **Comprehensive Logging**: Winston-based logging system
- **Error Handling**: Centralized error handling with detailed logging
- **API Documentation**: Swagger/OpenAPI documentation
- **Testing**: Comprehensive test suite with Jest
- **Docker Support**: Containerized deployment

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis
- **Authentication**: JWT (jsonwebtoken)
- **Payments**: Stripe
- **Real-time**: Socket.io
- **File Upload**: Cloudinary
- **Email**: Nodemailer
- **Testing**: Jest, Supertest
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB 7.0+
- Redis 7.0+
- Stripe account (for payments)
- Cloudinary account (for image uploads)
- Email service (Gmail SMTP recommended)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd starbucks-backend
npm install
```

### 2. Environment Setup

```bash
cp env.example .env
```

Update the `.env` file with your configuration:

```env
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/starbucks_db
MONGODB_TEST_URI=mongodb://localhost:27017/starbucks_test_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRE=30d

# Redis
REDIS_URL=redis://localhost:6379

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@starbucks.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Start Services

```bash
# Start MongoDB and Redis
# MongoDB: mongod
# Redis: redis-server

# Start the application
npm run dev
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/refresh` | Refresh token | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/auth/verify-email` | Verify email | No |

### Product Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products` | Get all products | No |
| GET | `/api/products/:id` | Get single product | No |
| GET | `/api/products/featured` | Get featured products | No |
| GET | `/api/products/new` | Get new products | No |
| GET | `/api/products/seasonal` | Get seasonal products | No |
| GET | `/api/products/categories` | Get product categories | No |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |
| DELETE | `/api/products/:id` | Delete product | Admin |

### Order Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/orders` | Create new order | Yes |
| GET | `/api/orders` | Get user orders | Yes |
| GET | `/api/orders/:id` | Get single order | Yes |
| PATCH | `/api/orders/:id/status` | Update order status | Admin/Staff |
| PATCH | `/api/orders/:id/cancel` | Cancel order | Yes |
| POST | `/api/orders/:id/payment-intent` | Create payment intent | Yes |
| POST | `/api/orders/:id/confirm-payment` | Confirm payment | Yes |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/profile` | Get user profile | Yes |
| PUT | `/api/users/profile` | Update user profile | Yes |
| PUT | `/api/users/preferences` | Update preferences | Yes |
| POST | `/api/users/addresses` | Add address | Yes |
| PUT | `/api/users/addresses/:id` | Update address | Yes |
| DELETE | `/api/users/addresses/:id` | Delete address | Yes |
| GET | `/api/users/rewards` | Get user rewards | Yes |
| PUT | `/api/users/change-password` | Change password | Yes |

### Payment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments/create-intent` | Create payment intent | Yes |
| POST | `/api/payments/confirm` | Confirm payment | Yes |
| POST | `/api/payments/create-customer` | Create Stripe customer | Yes |
| GET | `/api/payments/payment-methods` | Get payment methods | Yes |
| POST | `/api/payments/payment-methods` | Add payment method | Yes |
| DELETE | `/api/payments/payment-methods/:id` | Remove payment method | Yes |
| POST | `/api/payments/webhook` | Stripe webhook | No |

### Store Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/stores` | Get all stores | No |
| GET | `/api/stores/:id` | Get single store | No |
| GET | `/api/stores/:id/hours` | Get store hours | No |
| GET | `/api/stores/nearby` | Get nearby stores | No |

### Rewards Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/rewards` | Get all rewards | No |
| GET | `/api/rewards/available` | Get available rewards | Yes |
| GET | `/api/rewards/status` | Get user rewards status | Yes |
| POST | `/api/rewards/redeem` | Redeem reward | Yes |
| GET | `/api/rewards/history` | Get redemption history | Yes |
| GET | `/api/rewards/tiers` | Get rewards tiers | No |

### Gift Card Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/gift-cards/designs` | Get gift card designs | No |
| POST | `/api/gift-cards/create` | Create gift card | Yes |
| GET | `/api/gift-cards/my-cards` | Get user's gift cards | Yes |
| POST | `/api/gift-cards/check-balance` | Check gift card balance | No |
| POST | `/api/gift-cards/use` | Use gift card | Yes |
| POST | `/api/gift-cards/generate-pdf` | Generate PDF | Yes |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/dashboard` | Get dashboard stats | Admin |
| GET | `/api/admin/users` | Get all users | Admin |
| PATCH | `/api/admin/users/:id/status` | Update user status | Admin |
| GET | `/api/admin/orders` | Get all orders | Admin |
| PATCH | `/api/admin/orders/:id/status` | Update order status | Admin |
| GET | `/api/admin/products/analytics` | Get product analytics | Admin |
| POST | `/api/admin/cache/clear` | Clear cache | Admin |
| GET | `/api/admin/logs` | Get system logs | Admin |

## 🔧 Development

### Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Database
npm run seed        # Seed database with sample data
npm run migrate     # Run database migrations

# Linting
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint errors
```

### Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.ts  # MongoDB connection
│   ├── redis.ts     # Redis connection
│   ├── logger.ts    # Winston logger
│   └── socketio.ts  # Socket.io setup
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
│   ├── auth.ts      # Authentication middleware
│   └── errorHandler.ts # Error handling
├── models/          # Mongoose models
│   ├── User.ts      # User model
│   ├── Product.ts   # Product model
│   └── Order.ts     # Order model
├── routes/          # API routes
│   ├── authRoutes.ts
│   ├── productRoutes.ts
│   ├── orderRoutes.ts
│   └── ...
├── services/        # Business logic services
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
├── tests/           # Test files
└── server.ts        # Main server file
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- api.test.ts
```

### Test Structure

- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full workflow testing

## 🚀 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Build individual service
docker build -t starbucks-backend ./backend

# Run container
docker run -p 5000:5000 starbucks-backend
```

### Environment Variables for Production

Make sure to set these environment variables in production:

- `NODE_ENV=production`
- `JWT_SECRET` (strong, random secret)
- `JWT_REFRESH_SECRET` (strong, random secret)
- `MONGODB_URI` (production MongoDB connection)
- `REDIS_URL` (production Redis connection)
- `STRIPE_SECRET_KEY` (production Stripe key)
- `CLOUDINARY_*` (production Cloudinary credentials)

### Health Check

The API includes a health check endpoint:

```bash
GET /health
```

Returns:
```json
{
  "status": "OK",
  "timestamp": "2023-11-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Cross-origin resource sharing protection
- **Helmet**: Security headers
- **Input Validation**: Request validation with express-validator
- **SQL Injection Protection**: Mongoose ODM protection
- **XSS Protection**: Input sanitization

## 📊 Monitoring & Logging

### Logging

The application uses Winston for comprehensive logging:

- **Error Logs**: `logs/error.log`
- **Combined Logs**: `logs/combined.log`
- **Console Output**: Development mode

### Log Levels

- `error`: Error messages
- `warn`: Warning messages
- `info`: Informational messages
- `debug`: Debug messages

### Monitoring

- **Health Checks**: Built-in health check endpoint
- **Performance Metrics**: Request timing and response codes
- **Error Tracking**: Comprehensive error logging
- **Database Monitoring**: Connection status monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@starbucks.com or create an issue in the repository.

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added real-time features and admin panel
- **v1.2.0** - Enhanced payment integration and gift cards
- **v1.3.0** - Added comprehensive testing and Docker support

---

**Built with ❤️ for Starbucks The Next Version**
