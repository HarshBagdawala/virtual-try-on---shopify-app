import React from 'react';
import '../styles/ProductCard.css';

/**
 * ProductCard Component - Displays individual product with image, title, price
 */
const ProductCard = ({ product }) => {
  const { title, price, image, link, relevanceScore } = product;

  const handleBuyNow = () => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img 
          src={image} 
          alt={title}
          className="product-image"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/200?text=No+Image';
          }}
        />
        {relevanceScore && (
          <div className="relevance-badge">
            ⭐ {relevanceScore}%
          </div>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-title" title={title}>
          {title.length > 50 ? `${title.substring(0, 50)}...` : title}
        </h3>
        
        <div className="product-price">
          {price && price !== 'N/A' ? `₹${parseFloat(price).toLocaleString()}` : 'Price not available'}
        </div>
        
        <button 
          className="buy-button"
          onClick={handleBuyNow}
          title="Open product page"
        >
          🛒 Buy Now
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
