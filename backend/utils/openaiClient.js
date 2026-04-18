const axios = require('axios');
const logger = require('./logger');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Call OpenAI API to analyze user query and extract product intent
 * @param {string} userMessage - The user's query
 * @returns {Promise<object>} Extracted intent with keywords, category, and price range
 */
const analyzeUserIntent = async (userMessage) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      logger.error('Missing OpenAI API key');
      throw new Error('OPENAI_API_KEY is required');
    }

    logger.debug(`Analyzing intent for message: "${userMessage}"`);

    const systemPrompt = `You are a product search analyzer. Analyze the user's message and extract:
1. Product category/type (e.g., "face wash", "shampoo", "phone")
2. Keywords that could match product titles
3. Price range if mentioned (in format: {min: 0, max: 1000} or null if not specified)
4. Any specific features or requirements

Return ONLY valid JSON (no markdown, no code blocks) with exactly this structure:
{
  "category": "product category",
  "keywords": ["keyword1", "keyword2"],
  "priceRange": {"min": number, "max": number} or null,
  "features": ["feature1", "feature2"]
}`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    
    // Parse the JSON response
    const intent = JSON.parse(content);
    
    logger.debug(`Extracted intent: ${JSON.stringify(intent)}`);
    return intent;
  } catch (error) {
    if (error.response?.status === 401) {
      logger.error('OpenAI API Error: Invalid API key');
      throw new Error('Invalid OpenAI API key');
    }
    
    logger.error('OpenAI API Error:', error.message);
    throw new Error(`Failed to analyze query: ${error.message}`);
  }
};

module.exports = {
  analyzeUserIntent
};
