import { useState, useCallback } from 'react';
import { sendChatMessage } from '../services/api';

/**
 * Custom hook for managing chat functionality
 */
export const useChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 'greeting',
      text: '👋 Hello! Tell me what product you\'re looking for. For example: "Show me face wash under 500" or "Best shampoo for hair fall"',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (userMessage) => {
    // Clear previous error
    setError(null);
    
    // Add user message to chat
    const userMsg = {
      id: `user-${Date.now()}`,
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Call backend API
      const response = await sendChatMessage(userMessage);
      
      // Add bot response with products
      const botMsg = {
        id: `bot-${Date.now()}`,
        text: response.message,
        sender: 'bot',
        timestamp: new Date(),
        products: response.products || [],
        intent: response.intent
      };
      
      setMessages(prev => [...prev, botMsg]);
      
      return response;
    } catch (err) {
      setError(err.message || 'An error occurred');
      
      // Add error message to chat
      const errorMsg = {
        id: `error-${Date.now()}`,
        text: `❌ ${err.message || 'Failed to get recommendations. Please try again.'}`,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: 'greeting',
        text: '👋 Hello! Tell me what product you\'re looking for. For example: "Show me face wash under 500" or "Best shampoo for hair fall"',
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages
  };
};

export default useChatbot;
