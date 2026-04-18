# Backend API Architecture & Setup Guide

## 📚 Table of Contents
1. [Express Server Setup](#express-server-setup)
2. [Routes & Endpoints](#routes--endpoints)
3. [Services](#services)
4. [Utilities](#utilities)
5. [Error Handling](#error-handling)
6. [Testing](#testing)

## Express Server Setup

### server.js Overview

The main server file initializes Express with:

```javascript
// Middleware stack:
1. express.json()           - Parse JSON requests
2. CORS middleware          - Allow cross-origin requests
3. Request logger           - Log all requests
4. Routes handling          - Mount chat routes
5. Error handler            - Catch and format errors
6. 404 handler              - Handle undefined routes
```

### Starting the Server

```bash
# Development (with auto-reload using nodemon)
npm run dev

# Production
npm start

# Expected Output:
# [2024-01-01T12:00:00.000Z] ℹ️  🚀 Product Recommendation API running on http://localhost:5000
# [2024-01-01T12:00:00.000Z] ℹ️  ✅ Shopify Store: your-store.myshopify.com
# [2024-01-01T12:00:00.000Z] ℹ️  ✅ OpenAI Model: gpt-4o-mini
```

## Routes & Endpoints

### GET /health

Health check endpoint to verify backend is operational.

```bash
curl http://localhost:5000/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### POST /api/chat

Main endpoint for product recommendations.

#### Request Format:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me face wash under 500"}'
```

#### Request Body:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | User's natural language query |

#### Response (Success - 200):

```json
{
  "query": "Show me face wash under 500",
  "intent": {
    "category": "face wash",
    "keywords": ["face wash", "facial cleanser"],
    "priceRange": {"min": 0, "max": 500},
    "features": ["affordable", "under budget"]
  },
  "products": [
    {
      "id": "gid://shopify/Product/7242069549...",
      "title": "Gentle Hydrating Face Wash",
      "price": "349.99",
      "image": "https://cdn.shopify.com/...",
      "link": "https://your-store.myshopify.com/products/gentle-face-wash",
      "relevanceScore": 94.5
    },
    {
      "id": "gid://shopify/Product/7265412456...",
      "title": "Daily Face Cleanser",
      "price": "299.99",
      "image": "https://cdn.shopify.com/...",
      "link": "https://your-store.myshopify.com/products/daily-face-cleanser",
      "relevanceScore": 87.3
    },
    {
      "id": "gid://shopify/Product/7298765432...",
      "title": "Foam Face Wash",
      "price": "399.99",
      "image": "https://cdn.shopify.com/...",
      "link": "https://your-store.myshopify.com/products/foam-face-wash",
      "relevanceScore": 81.2
    }
  ],
  "message": "Found 3 products matching your request",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Response (Error - 400/500):

```json
{
  "error": "Message is required and must be a non-empty string",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Services

### productFilter.js

Handles product filtering and ranking logic.

#### Key Functions:

**1. calculateRelevanceScore(product, intent)**
- Scores each product 0-100 based on relevance
- Weights: Category 40%, Keywords 40%, Features 15%, Price 5%

```javascript
const score = calculateRelevanceScore(product, intent);
// Returns: 87.5
```

**2. filterAndRankProducts(products, intent, topN)**
- Filters products with relevance > 10
- Ranks by relevance score
- Returns top N products

```javascript
const topProducts = filterAndRankProducts(allProducts, intent, 3);
// Returns: Array of top 3 products with highest relevance scores
```

**3. formatProductResponse(product)**
- Transforms Shopify product to API response format
- Extracts image, price, and constructs product link

```javascript
const formatted = formatProductResponse(shopifyProduct);
// Returns: {id, title, price, image, link, relevanceScore}
```

**4. parsePrice(product)**
- Safely extracts price from product object
- Returns Infinity if price unavailable

```javascript
const price = parsePrice(product);
// Returns: 299.99
```

## Utilities

### logger.js

Simple logging utility with timestamps and emoji indicators.

```javascript
logger.info('Server started');        // ℹ️  prefix
logger.error('API failed', error);    // ❌ prefix
logger.warn('Deprecated API');        // ⚠️  prefix
logger.debug('Debug message');        // 🔍 prefix (only if DEBUG=true)
```

### shopifyClient.js

Shopify Admin API integration.

#### Functions:

**1. createShopifyClient()**
- Returns axios instance configured for Shopify API
- Uses credentials from environment variables

```javascript
const client = createShopifyClient();
// Returns: axios instance with Shopify auth headers
```

**2. fetchShopifyProducts(limit)**
- Fetches products from Shopify store
- Parameters:
  - `limit` (number): How many products to fetch (max 250)

```javascript
const products = await fetchShopifyProducts(100);
// Returns: Array of product objects with: id, title, handle, price_range, image
```

**3. getProductDetails(productId)**
- Fetches detailed information for single product
- Parameters:
  - `productId` (string): Shopify product ID

```javascript
const product = await getProductDetails('gid://shopify/Product/123');
// Returns: Complete product object with all variants and details
```

### openaiClient.js

OpenAI API integration for NLP intent extraction.

#### Functions:

**1. analyzeUserIntent(userMessage)**
- Calls GPT-4 mini to extract product intent
- Returns structured JSON with:
  - `category`: Product type
  - `keywords`: Matching terms
  - `priceRange`: Min/max if specified
  - `features`: Specific requirements

```javascript
const intent = await analyzeUserIntent("face wash under 500");
// Returns:
// {
//   "category": "face wash",
//   "keywords": ["face wash", "facial cleanser", "cleanser"],
//   "priceRange": {"min": 0, "max": 500},
//   "features": ["affordable", "budget-friendly"]
// }
```

## Error Handling

### Error Types & Handling

The backend implements centralized error handling:

```javascript
// 1. Validation Errors (400)
if (!message || message.trim().length === 0) {
  return res.status(400).json({
    error: 'Message is required and must be a non-empty string'
  });
}

// 2. API Errors (500)
// Automatically caught by middleware and formatted

// 3. Custom Error Messages
logger.error('Shopify API Error:', error.message);
throw new Error(`Failed to fetch products: ${error.message}`);
```

### Error Response Format

All errors follow consistent format:

```json
{
  "error": "Error description",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Testing

### Manual Testing with cURL

#### Test 1: Health Check
```bash
curl http://localhost:5000/health
```

#### Test 2: Basic Product Search
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me face wash"}'
```

#### Test 3: Price Range Query
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "phones under 30000"}'
```

#### Test 4: Error Handling (Empty Message)
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": ""}'
```

### Console Output Examples

#### Successful Request Flow:
```
[2024-01-01T12:00:00.000Z] ℹ️  POST /api/chat
[2024-01-01T12:00:00.001Z] ℹ️  Received chat message: "face wash under 500"
[2024-01-01T12:00:00.001Z] ℹ️  Step 1: Analyzing user intent with OpenAI...
[2024-01-01T12:00:00.500Z] ℹ️  Step 2: Fetching products from Shopify...
[2024-01-01T12:00:00.700Z] ℹ️  Step 3: Filtering and ranking products...
[2024-01-01T12:00:00.701Z] ℹ️  Successfully returned 3 products
```

#### Error Flow:
```
[2024-01-01T12:00:00.000Z] ℹ️  POST /api/chat
[2024-01-01T12:00:00.001Z] ❌ OpenAI API Error: Invalid API key
[2024-01-01T12:00:00.001Z] ❌ Chat endpoint error: Invalid OpenAI API key
```

## Performance Tips

1. **Reduce Product Fetch Limit**: Fetch fewer products per request for faster response
   ```javascript
   const allProducts = await fetchShopifyProducts(50); // Instead of 100
   ```

2. **Cache Products**: Implement caching to avoid repeated Shopify API calls
   ```javascript
   const cache = new Map();
   const cacheKey = 'all_products';
   ```

3. **Implement Rate Limiting**: Prevent API abuse
   ```javascript
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
   app.use('/api/chat', limiter);
   ```

4. **Add Request Timeout**: Prevent hanging requests
   ```javascript
   const TIMEOUT = 30000; // 30 seconds
   ```

---

**Last Updated:** January 2024
