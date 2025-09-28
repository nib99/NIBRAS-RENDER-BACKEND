# Nibras Ahmed Digital Products - Backend API

Modern, secure, and scalable Node.js backend API for digital products marketplace.

## 🚀 Features

- **RESTful API**: Complete REST API with Express.js
- **Authentication**: JWT-based authentication with bcrypt
- **Database**: MongoDB with Mongoose ODM
- **Security**: Helmet, CORS, rate limiting, input validation
- **Payments**: Stripe, PayPal, and Chapa integration
- **File Upload**: Cloudinary integration for images
- **Email**: Nodemailer with multiple providers
- **Logging**: Winston for comprehensive logging
- **Validation**: Express-validator for input validation
- **Error Handling**: Centralized error handling
- **Documentation**: Comprehensive API documentation

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB database
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Fill in your environment variables
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **API will be available at**
   `http://localhost:5000`

## 🚀 Deployment to Render

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure settings:
     - **Name**: nibras-backend
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
   - Add environment variables
   - Deploy!

### Method 2: Manual Deploy

1. **Install Render CLI**
   ```bash
   npm install -g @render/cli
   ```

2. **Login and deploy**
   ```bash
   render login
   render deploy
   ```

## ⚙️ Environment Variables

### Required Variables

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-frontend-domain.com
```

### Payment Gateways

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# Chapa (Ethiopian)
CHAPA_SECRET_KEY=your_chapa_secret
```

### Email Configuration

```env
# Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Or SendGrid
SENDGRID_API_KEY=your-sendgrid-key
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Password reset
- `POST /api/auth/reset-password` - Reset password

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get single order

### Payments
- `POST /api/payments/stripe` - Process Stripe payment
- `POST /api/payments/paypal` - Process PayPal payment
- `POST /api/payments/chapa` - Process Chapa payment
- `POST /api/payments/webhook` - Payment webhooks

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent abuse and DDoS
- **CORS**: Configured for your frontend domain
- **Helmet**: Security headers
- **Input Validation**: Express-validator
- **XSS Protection**: Clean user input
- **NoSQL Injection**: Mongoose sanitization

## 📈 Performance

- **Compression**: Gzip compression enabled
- **Caching**: Redis integration ready
- **Database Indexing**: Optimized MongoDB indexes
- **Error Handling**: Centralized error management
- **Logging**: Winston for production logging

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

## 📝 API Documentation

Visit `/api/docs` for interactive API documentation.

### Example Requests

**Register User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Get Products**
```bash
curl -X GET "http://localhost:5000/api/products?category=templates&limit=10"
```

**Create Order**
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "items": [
      {
        "product": "product_id_here",
        "quantity": 1,
        "price": 29.99
      }
    ]
  }'
```

## 🔧 Configuration

### Database Setup

1. **Create MongoDB Atlas account**
2. **Create cluster and database**
3. **Get connection string**
4. **Add to MONGODB_URI in environment**

### Payment Setup

#### Stripe
1. Create Stripe account
2. Get API keys from dashboard
3. Set up webhooks for order completion

#### PayPal
1. Create PayPal Developer account
2. Create application
3. Get Client ID and Secret

#### Chapa
1. Register at chapa.co
2. Get API credentials
3. Configure webhook endpoints

## 📊 Monitoring

### Health Check
`GET /health` returns server status and uptime

### Logging
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`
- Console output in development

### Performance Monitoring
- Response time tracking
- Database query optimization
- Memory usage monitoring

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MONGODB_URI format
   - Verify network access in Atlas
   - Check IP whitelist

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Validate token format

3. **Payment Webhook Failures**
   - Verify webhook URLs
   - Check endpoint signatures
   - Review webhook logs

4. **File Upload Issues**
   - Check Cloudinary credentials
   - Verify file size limits
   - Review CORS settings

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Check specific module
DEBUG=express:* npm run dev
```

## 📈 Scaling

### Horizontal Scaling
- Use Render's auto-scaling features
- Implement Redis for session storage
- Use MongoDB Atlas for database scaling

### Performance Optimization
- Enable database indexing
- Implement caching strategies
- Use CDN for static assets
- Optimize database queries

## 🔄 Updates

### Database Migrations
```bash
npm run migrate
```

### Seed Database
```bash
npm run seed
```

## 📞 Support

- **Documentation**: Check inline code comments
- **Issues**: Create GitHub issues
- **Email**: support@nibrasahmed.com

## 📄 License

MIT License - Feel free to use in your projects!

---

**Created by Nibras Ahmed** - Professional Backend Developer

🚀 **Your backend is ready for production deployment!**
