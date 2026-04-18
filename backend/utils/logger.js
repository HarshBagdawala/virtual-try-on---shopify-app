/**
 * Simple logger utility for console output with timestamps
 */
const logger = {
  info: (message) => {
    console.log(`[${new Date().toISOString()}] ℹ️  ${message}`);
  },
  
  error: (message, error = '') => {
    console.error(`[${new Date().toISOString()}] ❌ ${message}`, error);
  },
  
  warn: (message) => {
    console.warn(`[${new Date().toISOString()}] ⚠️  ${message}`);
  },
  
  debug: (message) => {
    if (process.env.DEBUG === 'true') {
      console.log(`[${new Date().toISOString()}] 🔍 ${message}`);
    }
  }
};

module.exports = logger;
