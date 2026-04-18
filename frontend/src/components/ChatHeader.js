import React from 'react';
import '../styles/ChatHeader.css';

/**
 * ChatHeader Component - Header with title and clear button
 */
const ChatHeader = ({ onClear, messageCount }) => {
  return (
    <div className="chat-header">
      <div className="header-left">
        <h1 className="chat-title">🤖 Product Recommendation Chatbot</h1>
        <p className="chat-subtitle">Powered by AI & Shopify</p>
      </div>
      
      <div className="header-right">
        <span className="message-count">{messageCount} messages</span>
        <button
          className="clear-button"
          onClick={onClear}
          title="Clear chat history"
        >
          🗑️ Clear Chat
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
