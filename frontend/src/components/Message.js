import React from 'react';
import ProductCard from './ProductCard';
import '../styles/Message.css';

/**
 * Message Component - Displays chat messages and product recommendations
 */
const Message = ({ message }) => {
  const { sender, text, products, timestamp, isError } = message;

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`message message-${sender} ${isError ? 'error' : ''}`}>
      <div className="message-content">
        <span className="message-text">{text}</span>
        <span className="message-time">{formatTime(timestamp)}</span>
      </div>
      
      {products && products.length > 0 && (
        <div className="products-container">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Message;
