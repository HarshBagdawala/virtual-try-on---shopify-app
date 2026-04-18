const axios = require('axios');
const logger = require('./logger');

/**
 * Initialize Shopify API client
 * @returns {object} Configured axios instance for Shopify Admin API
 */
const createShopifyClient = () => {
  const { SHOPIFY_STORE, SHOPIFY_ACCESS_TOKEN } = process.env;
  
  if (!SHOPIFY_STORE || !SHOPIFY_ACCESS_TOKEN) {
    logger.error('Missing Shopify credentials');
    throw new Error('SHOPIFY_STORE and SHOPIFY_ACCESS_TOKEN are required');
  }

  return axios.create({
    baseURL: `https://${SHOPIFY_STORE}/admin/api/2023-10`,
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Fetch all products from Shopify store
 * @param {number} limit - Number of products to fetch (max 250)
 * @returns {Promise<Array>} Array of products
 */
const fetchShopifyProducts = async (limit = 50) => {
  try {
    const client = createShopifyClient();
    logger.info(`Fetching ${limit} products from Shopify...`);
    
    const response = await client.get('/products.json', {
      params: {
        limit: Math.min(limit, 250),
        fields: 'id,title,handle,price_range,image,body_html'
      }
    });

    return response.data.products || [];
  } catch (error) {
    logger.error('Shopify API Error:', error.response?.data || error.message);
    throw new Error(`Failed to fetch products from Shopify: ${error.message}`);
  }
};

/**
 * Get product details by ID
 * @param {string} productId - Shopify product ID
 * @returns {Promise<object>} Product details
 */
const getProductDetails = async (productId) => {
  try {
    const client = createShopifyClient();
    const response = await client.get(`/products/${productId}.json`);
    return response.data.product;
  } catch (error) {
    logger.error('Shopify Product Detail Error:', error.message);
    throw new Error(`Failed to fetch product details: ${error.message}`);
  }
};

module.exports = {
  createShopifyClient,
  fetchShopifyProducts,
  getProductDetails
};
