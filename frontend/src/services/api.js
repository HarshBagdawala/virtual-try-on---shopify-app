/**
 * API Service - Handles all communication with backend
 */
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Send chat message to backend and get product recommendations
 * @param {string} message - User's query message
 * @returns {Promise<object>} Response with products and recommendations
 */
export const sendChatMessage = async (message) => {
  try {
    const response = await apiClient.post('/chat', { message });
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error(error.message || 'Failed to get recommendations');
  }
};

export default apiClient;
