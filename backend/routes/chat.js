const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { analyzeUserIntent } = require('../utils/openaiClient');
const { fetchShopifyProducts } = require('../utils/shopifyClient');
const { filterAndRankProducts, formatProductResponse } = require('../services/productFilter');

/**
 * POST /api/chat
 * Main endpoint for product recommendation chatbot
 * 
 * Request body:
 * {
 *   "message": "Show me face wash under 500"
 * }
 * 
 * Response:
 * {
 *   "query": "Show me face wash under 500",
 *   "products": [
 *     {
 *       "id": "...",
 *       "title": "...",
 *       "price": "...",
 *       "image": "...",
 *       "link": "...",
 *       "relevanceScore": 85.5
 *     }
 *   ],
 *   "message": "Found 3 products matching your query",
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
router.post('/', async (req, res, next) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message is required and must be a non-empty string',
        timestamp: new Date().toISOString()
      });
    }

    const userMessage = message.trim();
    logger.info(`Received chat message: "${userMessage}"`);

    // Step 1: Analyze user intent using OpenAI
    logger.info('Step 1: Analyzing user intent with OpenAI...');
    const intent = await analyzeUserIntent(userMessage);

    // Step 2: Fetch products from Shopify
    logger.info('Step 2: Fetching products from Shopify...');
    const allProducts = await fetchShopifyProducts(100);

    if (allProducts.length === 0) {
      return res.status(200).json({
        query: userMessage,
        products: [],
        message: 'No products available in the store',
        timestamp: new Date().toISOString()
      });
    }

    // Step 3: Filter and rank products based on intent
    logger.info('Step 3: Filtering and ranking products...');
    const topProducts = filterAndRankProducts(allProducts, intent, 3);

    // Step 4: Format response
    const formattedProducts = topProducts.map(formatProductResponse);

    // Determine response message
    let responseMessage;
    if (formattedProducts.length === 0) {
      responseMessage = `Sorry, no products found matching "${intent.category}". Try a different search.`;
    } else if (formattedProducts.length === 1) {
      responseMessage = `Found 1 product matching your request.`;
    } else {
      responseMessage = `Found ${formattedProducts.length} products matching your request.`;
    }

    logger.info(`Successfully returned ${formattedProducts.length} products`);

    return res.status(200).json({
      query: userMessage,
      intent: {
        category: intent.category,
        keywords: intent.keywords,
        priceRange: intent.priceRange,
        features: intent.features
      },
      products: formattedProducts,
      message: responseMessage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Chat endpoint error:', error.message);
    next(error);
  }
});

module.exports = router;
