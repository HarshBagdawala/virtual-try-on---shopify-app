# Deployment & Production Guide

## 📋 Deployment Checklist

- [ ] Backend server configured with environment variables
- [ ] Frontend build process tested
- [ ] API endpoints verified working
- [ ] CORS configuration reviewed
- [ ] Error handling and logging implemented
- [ ] Performance optimized
- [ ] Security measures in place
- [ ] Documentation updated

## Backend Deployment

### Environment Variables (Production)

```env
# Shopify
SHOPIFY_STORE=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shppa_xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# Server
PORT=5000
NODE_ENV=production
DEBUG=false

# Frontend URL
FRONTEND_URL=https://your-domain.com
```

### Deploy to Heroku

```bash
# 1. Create Heroku app
heroku create your-chatbot-api

# 2. Set environment variables
heroku config:set SHOPIFY_STORE=your-store.myshopify.com
heroku config:set SHOPIFY_ACCESS_TOKEN=shppa_xxx
heroku config:set OPENAI_API_KEY=sk-xxx
heroku config:set FRONTEND_URL=https://your-frontend-url.com

# 3. Deploy
git push heroku main

# 4. Monitor logs
heroku logs --tail
```

### Deploy to AWS (EC2)

```bash
# 1. SSH into instance
ssh -i key.pem ubuntu@your-ip

# 2. Install dependencies
sudo apt-get update
sudo apt-get install nodejs npm

# 3. Clone repository
git clone your-repo
cd backend

# 4. Install npm packages and run
npm install
npm start

# 5. Use PM2 for process management
npm install -g pm2
pm2 start server.js --name "chatbot-api"
pm2 save
pm2 startup
```

## Frontend Deployment

### Build Process

```bash
# 1. Navigate to frontend
cd frontend

# 2. Build for production
npm run build

# 3. Output in build/ folder ready for deployment
```

### Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Set environment variables in Vercel dashboard
# REACT_APP_API_URL=https://your-api-domain.com/api
```

### Deploy to Netlify

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Configure netlify.toml in frontend directory
[build]
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# 3. Deploy
netlify deploy

# 4. Authorize and confirm deployment
```

### Deploy to AWS (S3 + CloudFront)

```bash
# 1. Create S3 bucket
aws s3 mb s3://my-chatbot-frontend

# 2. Build React app
npm run build

# 3. Upload to S3
aws s3 sync build/ s3://my-chatbot-frontend --delete

# 4. Create CloudFront distribution pointing to S3 bucket
```

## Production Configuration

### CORS Security

In `backend/server.js`:

```javascript
// Production: Whitelist specific domains
const allowedOrigins = [
  'https://your-domain.com',
  'https://app.your-domain.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));
```

### Rate Limiting

Add to `backend/server.js`:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  message: 'Too many requests, please try again later'
});

app.use('/api/', limiter);
```

### HTTPS/SSL

Configure SSL certificate:

```bash
# Using Let's Encrypt (certbot)
sudo certbot certonly --standalone -d your-domain.com

# Use certificate in Node.js
const https = require('https');
const fs = require('fs');

const ssl_options = {
  key: fs.readFileSync('/etc/letsencrypt/live/your-domain/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/your-domain/fullchain.pem')
};

https.createServer(ssl_options, app).listen(443);
```

## Performance Optimization

### Backend Optimization

1. **Enable Compression:**
```javascript
const compression = require('compression');
app.use(compression());
```

2. **Implement Caching:**
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// Cache products
const products = cache.get('shopify_products');
if (!products) {
  const freshProducts = await fetchShopifyProducts();
  cache.set('shopify_products', freshProducts);
}
```

3. **Add Connection Pooling:**
```javascript
const http = require('http');
const agent = new http.Agent({ keepAlive: true });
```

### Frontend Optimization

1. **Code Splitting:**
```javascript
// Lazy load components
const Chatbot = React.lazy(() => import('./components/Chatbot'));

<React.Suspense fallback={<div>Loading...</div>}>
  <Chatbot />
</React.Suspense>
```

2. **Memoization:**
```javascript
const ProductCard = React.memo(({ product }) => {
  // Component only re-renders if product prop changes
  return <div>{product.title}</div>;
});
```

3. **Image Optimization:**
```javascript
// Use responsive images
<img 
  src={image}
  srcSet={`${image}?w=200 200w, ${image}?w=400 400w`}
  sizes="(max-width: 600px) 200px, 400px"
/>
```

## Monitoring & Analytics

### Backend Monitoring

```javascript
// Add Application Performance Monitoring (APM)
const apm = require('elastic-apm-node');

apm.start({
  serviceName: 'chatbot-api',
  serverUrl: 'http://your-elastic-url'
});
```

### Frontend Analytics

```javascript
// Add Google Analytics
import ReactGA from 'react-ga4';

ReactGA.initialize('GA_MEASUREMENT_ID');

// Track page views
useEffect(() => {
  ReactGA.pageview(window.location.pathname);
}, []);

// Track events
const trackProductClick = (productId) => {
  ReactGA.event({
    category: 'engagement',
    action: 'product_click',
    label: productId
  });
};
```

### Logging

```javascript
// Centralized logging with Winston
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Backup & Disaster Recovery

### Database Backup

```bash
# Schedule daily Shopify API data backup
0 2 * * * /usr/bin/node backup-products.js
```

### Error Recovery

```javascript
// Implement retry logic
const retryAsync = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## Rollback Procedure

```bash
# If deployment causes issues:
# 1. Revert to previous version
git revert HEAD

git push

# 2. Restart services
pm2 restart chatbot-api

# 3. Monitor logs
pm2 logs chatbot-api

# 4. Rollback frontend if needed
# Redeploy from Vercel/Netlify dashboard previous version
```

## Health Checks

```bash
# Monitor backend health
curl https://api.your-domain.com/health

# Set up monitoring alert if returns non-200
```

## Documentation for Deployment Team

1. **Backend Deployment Steps:**
   - Clone repo
   - Install dependencies
   - Configure environment variables
   - Run migrations if needed
   - Start server with PM2
   - Verify health check endpoint

2. **Frontend Deployment Steps:**
   - Clone repo
   - Install dependencies
   - Build for production
   - Deploy to hosting service
   - Verify REACT_APP_API_URL points to API

3. **Rollback Procedure:**
   - Revert code commit
   - Restart services
   - Monitor logs for errors

---

**Last Updated:** January 2024
