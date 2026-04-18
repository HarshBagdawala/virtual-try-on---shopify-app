import React, { useEffect, useRef } from 'react';
import Message from './Message';
import '../styles/ChatWindow.css';

/**
 * ChatWindow Component - Displays all chat messages
 */
const ChatWindow = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="message message-bot loading-message">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
