import React, { useState, useRef, useEffect } from 'react';
import '../styles/ChatInput.css';

/**
 * ChatInput Component - Input field for user messages
 */
const ChatInput = ({ onSendMessage, isLoading = false }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <div className="input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder="Ask for products (e.g., 'face wash under 500')"
          className="chat-input"
          disabled={isLoading}
          autoComplete="off"
        />
        
        <button
          type="submit"
          className="send-button"
          disabled={isLoading || !inputValue.trim()}
          title={isLoading ? 'Loading...' : 'Send message'}
        >
          {isLoading ? (
            <span className="loading-spinner">⏳</span>
          ) : (
            <span>📤</span>
          )}
        </button>
      </div>
      
      {isLoading && (
        <div className="loading-indicator">
          Finding best products for you...
        </div>
      )}
    </form>
  );
};

export default ChatInput;
