import React from 'react';
import ChatHeader from './ChatHeader';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import useChatbot from '../hooks/useChatbot';
import '../styles/Chatbot.css';

/**
 * Main Chatbot Component - Orchestrates the entire chatbot UI
 */
const Chatbot = () => {
  const { messages, isLoading, error, sendMessage, clearMessages } = useChatbot();

  return (
    <div className="chatbot-container">
      <ChatHeader 
        messageCount={messages.length} 
        onClear={clearMessages}
      />
      
      <ChatWindow 
        messages={messages}
        isLoading={isLoading}
      />
      
      <ChatInput 
        onSendMessage={sendMessage}
        isLoading={isLoading}
      />
      
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default Chatbot;
