# Starbucks The Next Version - Full Stack Deployment Guide

## 🚀 Complete Full-Stack Application

This is a comprehensive, industry-grade full-stack web application for Starbucks The Next Version, featuring:

### Frontend Features
- **React 18** with TypeScript support
- **Responsive Design** - Mobile-first approach with industry-grade responsiveness
- **Real-time Updates** - Socket.io integration for live order tracking
- **State Management** - Zustand for efficient state management
- **API Integration** - Axios-based API service layer
- **Modern UI/UX** - Framer Motion animations and smooth interactions
- **Payment Integration** - Stripe payment processing
- **Authentication** - JWT-based auth with refresh tokens

### Backend Features
- **Node.js/Express** with TypeScript
- **MongoDB** with Mongoose ODM
- **Redis** caching for performance
- **JWT Authentication** with refresh tokens
- **Stripe Payment** integration with webhooks
- **Socket.io** for real-time communication
- **Email Service** with Nodemailer
- **Image Upload** with Cloudinary
- **Comprehensive Logging** with Winston
- **Rate Limiting** and security middleware
- **Comprehensive Testing** with Jest

## 📋 Prerequisites

### System Requirements
- Node.js 18+ and npm
- MongoDB 7.0+
- Redis 7.0+
- Docker and Docker Compose (optional)

### External Services
- Stripe account (for payments)
- Cloudinary account (for image uploads)
- Email service (Gmail SMTP recommended)
- Google Maps API key (for store locations)

## 🛠️ Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd starbucks-the-next-version
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
```

Update `.env` with your configuration:
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

### 3. Frontend Setup
```bash
cd .. # Back to root directory
npm install
```

Create `.env` file in root directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 4. Start Services

#### Option A: Manual Setup
```bash
# Terminal 1 - Start MongoDB
mongod

# Terminal 2 - Start Redis
redis-server

# Terminal 3 - Start Backend
cd backend
npm run dev

# Terminal 4 - Start Frontend
npm run dev
```

#### Option B: Docker Setup
```bash
# Start all services with Docker Compose
docker-compose up -d
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
```

### Frontend Tests
```bash
npm test                   # Run frontend tests
```

## 🚀 Deployment

### Production Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000

# Production Database
MONGODB_URI=mongodb://your-production-mongodb-uri
REDIS_URL=redis://your-production-redis-uri

# Production JWT Secrets (generate strong secrets)
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret

# Production Stripe Keys
STRIPE_SECRET_KEY=sk_live_your-production-stripe-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-production-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-production-webhook-secret

# Production Email
EMAIL_HOST=your-production-smtp-host
EMAIL_USERNAME=your-production-email
EMAIL_PASSWORD=your-production-password

# Production Cloudinary
CLOUDINARY_CLOUD_NAME=your-production-cloud-name
CLOUDINARY_API_KEY=your-production-api-key
CLOUDINARY_API_SECRET=your-production-api-secret

# Production CORS
CORS_ORIGIN=https://your-production-domain.com
```

#### Frontend (.env)
```env
VITE_API_URL=https://your-api-domain.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-production-stripe-key
VITE_GOOGLE_MAPS_API_KEY=your-production-google-maps-key
```

### Docker Production Deployment

1. **Build Images**
```bash
# Build backend
docker build -t starbucks-backend ./backend

# Build frontend
docker build -t starbucks-frontend .
```

2. **Deploy with Docker Compose**
```bash
# Update docker-compose.yml with production values
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment Options

#### Option 1: AWS Deployment
```bash
# Using AWS ECS
aws ecs create-cluster --cluster-name starbucks-cluster
aws ecs register-task-definition --cli-input-json file://task-definition.json
aws ecs create-service --cluster starbucks-cluster --service-name starbucks-service
```

#### Option 2: Google Cloud Platform
```bash
# Using Google Cloud Run
gcloud run deploy starbucks-backend --source ./backend
gcloud run deploy starbucks-frontend --source .
```

#### Option 3: Heroku Deployment
```bash
# Backend
cd backend
heroku create starbucks-backend
heroku addons:create mongolab:sandbox
heroku addons:create rediscloud:30
git push heroku main

# Frontend
cd ..
heroku create starbucks-frontend
git push heroku main
```

## 🔧 Configuration

### Database Setup
```bash
# Seed database with sample data
cd backend
npm run seed

# Run database migrations
npm run migrate
```

### SSL/HTTPS Setup
```bash
# Using Let's Encrypt
certbot --nginx -d your-domain.com
```

### CDN Setup
```bash
# Configure CloudFront for static assets
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

## 📊 Monitoring & Maintenance

### Health Checks
- Backend: `GET /health`
- Frontend: Built-in health monitoring

### Logging
- Backend logs: `backend/logs/`
- Error tracking: Winston logger
- Performance monitoring: Built-in metrics

### Backup Strategy
```bash
# MongoDB backup
mongodump --uri="mongodb://your-mongodb-uri" --out=backup/

# Redis backup
redis-cli BGSAVE
```

## 🔒 Security Checklist

- [ ] JWT secrets are strong and unique
- [ ] HTTPS is enabled in production
- [ ] Rate limiting is configured
- [ ] CORS is properly configured
- [ ] Input validation is enabled
- [ ] SQL injection protection is active
- [ ] XSS protection is enabled
- [ ] File upload restrictions are in place
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies are up to date

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
```bash
# Check MongoDB status
systemctl status mongod
# Restart MongoDB
systemctl restart mongod
```

2. **Redis Connection Error**
```bash
# Check Redis status
redis-cli ping
# Restart Redis
systemctl restart redis
```

3. **Port Already in Use**
```bash
# Find process using port
lsof -i :5000
# Kill process
kill -9 <PID>
```

4. **Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Performance Optimization

1. **Enable Gzip Compression**
2. **Configure Redis Caching**
3. **Optimize Database Queries**
4. **Use CDN for Static Assets**
5. **Enable HTTP/2**

## 📈 Scaling

### Horizontal Scaling
- Load balancer configuration
- Multiple backend instances
- Database sharding
- Redis clustering

### Vertical Scaling
- Increase server resources
- Optimize database performance
- Cache optimization
- CDN implementation

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          docker-compose -f docker-compose.prod.yml up -d
```

## 📞 Support

For technical support:
- Email: support@starbucks.com
- Documentation: [API Docs](http://localhost:5000/api-docs)
- Issues: GitHub Issues

---

**Built with ❤️ for Starbucks The Next Version**

This full-stack application provides a complete, production-ready solution with industry-grade features, security, and scalability.
