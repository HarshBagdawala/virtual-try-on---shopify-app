const logger = require('../utils/logger');

/**
 * Calculate relevance score for a product based on intent
 * @param {object} product - Product object
 * @param {object} intent - Intent extracted from user query
 * @returns {number} Relevance score (0-100)
 */
const calculateRelevanceScore = (product, intent) => {
  let score = 0;
  const { keywords = [], category = '', priceRange = null, features = [] } = intent;

  const title = (product.title || '').toLowerCase();
  const description = (product.body_html || '').toLowerCase();
  const combinedText = `${title} ${description}`;

  // Category matching (40 points)
  if (category && combinedText.includes(category.toLowerCase())) {
    score += 40;
  }

  // Keyword matching (40 points - distributed among keywords)
  if (keywords && keywords.length > 0) {
    const matchedKeywords = keywords.filter(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );
    score += (matchedKeywords.length / keywords.length) * 40;
  }

  // Features matching (15 points)
  if (features && features.length > 0) {
    const matchedFeatures = features.filter(feature => 
      combinedText.includes(feature.toLowerCase())
    );
    score += (matchedFeatures.length / features.length) * 15;
  }

  // Price range filtering (5 points for passing the filter)
  if (priceRange) {
    const productPrice = parsePrice(product);
    if (productPrice >= priceRange.min && productPrice <= priceRange.max) {
      score += 5;
    }
  } else if (priceRange === null) {
    // No price constraint, give bonus points
    score += 5;
  }

  return Math.min(score, 100);
};

/**
 * Parse product price from price_range.min_variant_price
 * @param {object} product - Product object
 * @returns {number} Price value
 */
const parsePrice = (product) => {
  try {
    if (product.price_range?.min_variant_price) {
      return parseFloat(product.price_range.min_variant_price);
    }
    return Infinity; // Return high value if price not available
  } catch {
    return Infinity;
  }
};

/**
 * Filter and rank products based on user intent
 * @param {Array} products - Array of Shopify products
 * @param {object} intent - Intent extracted from user query
 * @param {number} topN - Number of top products to return
 * @returns {Array} Filtered and ranked products
 */
const filterAndRankProducts = (products, intent, topN = 3) => {
  logger.info(`Filtering ${products.length} products for intent: ${intent.category}`);

  // Calculate relevance scores
  const scoredProducts = products
    .map(product => ({
      ...product,
      relevanceScore: calculateRelevanceScore(product, intent)
    }))
    .filter(product => product.relevanceScore > 10) // Filter out very low-scoring products
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topN);

  logger.info(`Found ${scoredProducts.length} relevant products`);
  return scoredProducts;
};

/**
 * Format product for API response
 * @param {object} product - Shopify product
 * @returns {object} Formatted product data
 */
const formatProductResponse = (product) => {
  const imageUrl = product.image?.src || 
                   (product.images?.[0]?.src) || 
                   'https://via.placeholder.com/200';
  
  const price = product.price_range?.min_variant_price || 
                product.price_range?.min_variant_price || 
                'N/A';

  return {
    id: product.id,
    title: product.title || 'Unknown Product',
    price: price,
    image: imageUrl,
    link: `https://${process.env.SHOPIFY_STORE}/products/${product.handle}`,
    relevanceScore: Math.round((product.relevanceScore || 0) * 100) / 100
  };
};

module.exports = {
  calculateRelevanceScore,
  filterAndRankProducts,
  formatProductResponse,
  parsePrice
};
