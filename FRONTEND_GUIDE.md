# Frontend Architecture & Component Guide

## 📚 Table of Contents
1. [Component Structure](#component-structure)
2. [Hooks & State Management](#hooks--state-management)
3. [Service Layer](#service-layer)
4. [Styling System](#styling-system)
5. [Testing & Debugging](#testing--debugging)

## Component Structure

### Component Hierarchy

```
App
└── Chatbot (Main orchestrator)
    ├── ChatHeader (Title, statistics, clear button)
    ├── ChatWindow (Message list)
    │   ├── Message (for each message)
    │   │   └── ProductCard (for each product)
    │   └── Typing indicator
    └── ChatInput (User input form)
```

### Component Details

#### Chatbot.js (Main Component)

Orchestrates the entire chatbot experience.

```javascript
// Props: None (uses custom hook)
// State: Managed by useChatbot hook
// Renders: Header, MessageWindow, Input, Error Banner

const Chatbot = () => {
  const { messages, isLoading, error, sendMessage, clearMessages } = useChatbot();
  // Returns: Full chatbot UI
};
```

#### ChatHeader.js

Displays title, message count, and clear button.

```javascript
// Props:
// - onClear: Function to clear chat history
// - messageCount: Number of messages in chat

// Features:
// - Shows chatbot branding
// - Displays message statistics
// - Clear chat button with confirmation
```

#### ChatWindow.js

Displays all messages and handles auto-scroll.

```javascript
// Props:
// - messages: Array of message objects
// - isLoading: Boolean indicating if API is processing

// Features:
// - Auto-scrolls to latest message
// - Shows typing indicator during loading
// - Smooth message animations
```

#### Message.js

Renders individual message with optional products.

```javascript
// Props:
// - message: Object with:
//   - sender: 'user' | 'bot'
//   - text: Message content
//   - products: Optional product array
//   - timestamp: Date object
//   - isError: Optional boolean for error styling

// Renders:
// - Message bubble (different colors for user/bot)
// - Timestamp
// - Products grid (if included)
```

#### ProductCard.js

Displays individual product in a card format.

```javascript
// Props:
// - product: Object with:
//   - title: Product name
//   - price: Product price
//   - image: Image URL
//   - link: Product URL
//   - relevanceScore: Matching score (0-100)

// Features:
// - Image with fallback
// - Relevance badge
// - Buy Now button opens product in new tab
// - Hover animations
```

#### ChatInput.js

Text input form for user queries.

```javascript
// Props:
// - onSendMessage: Callback function(message: string)
// - isLoading: Boolean to disable during processing

// Features:
// - Auto-focus on mount
// - Enter key to send
// - Shift+Enter for new line
// - Disabled state during loading
// - Loading indicator
```

## Hooks & State Management

### useChatbot.js

Custom React hook managing all chat state and logic.

#### State Variables:

```javascript
const [messages, setMessages] = useState([])        // All messages
const [isLoading, setIsLoading] = useState(false)   // API loading state
const [error, setError] = useState(null)            // Error message
```

#### Initial Message:
```javascript
{
  id: 'greeting',
  text: '👋 Hello! Tell me what product you\'re looking for...',
  sender: 'bot',
  timestamp: new Date()
}
```

#### Message Object Structure:

**User Message:**
```javascript
{
  id: 'user-1704096000000',
  text: 'Show me face wash under 500',
  sender: 'user',
  timestamp: 2024-01-01T12:00:00.000Z
}
```

**Bot Message with Products:**
```javascript
{
  id: 'bot-1704096000001',
  text: 'Found 3 products matching your request',
  sender: 'bot',
  timestamp: 2024-01-01T12:00:00.100Z,
  products: [
    {
      id: 'gid://shopify/Product/123',
      title: 'Face Wash 100ml',
      price: '299',
      image: 'https://example.com/image.jpg',
      link: 'https://store.com/products/face-wash',
      relevanceScore: 92.5
    }
  ],
  intent: {
    category: 'face wash',
    keywords: ['face wash', 'cleanser'],
    priceRange: {min: 0, max: 500},
    features: ['affordable']
  }
}
```

**Error Message:**
```javascript
{
  id: 'error-1704096000002',
  text: '❌ Failed to get recommendations. Please try again.',
  sender: 'bot',
  timestamp: 2024-01-01T12:00:00.200Z,
  isError: true
}
```

#### Key Functions:

**sendMessage(userMessage)**
- Adds user message to state
- Calls API
- Handles response or error
- Adds bot message to state

```javascript
const response = await sendMessage("face wash under 500");
// Automatically updates messages state
```

**clearMessages()**
- Resets messages to initial greeting
- Clears error state

```javascript
clearMessages();
// Messages reset to initial state
```

## Service Layer

### api.js

Handles all backend API communication.

#### API Client Configuration:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

#### Functions:

**sendChatMessage(message)**
- Sends user query to backend
- Returns complete response with products

```javascript
const response = await sendChatMessage('face wash under 500');

// Returns:
{
  query: 'face wash under 500',
  intent: {...},
  products: [...],
  message: 'Found 3 products matching your request',
  timestamp: '2024-01-01T12:00:00.000Z'
}
```

#### Error Handling:

```javascript
try {
  const response = await sendChatMessage(message);
} catch (error) {
  // Throws: Error with message from server or network error
  throw new Error(error.response?.data?.error || error.message);
}
```

## Styling System

### CSS Architecture

All components use CSS modules located in `src/styles/`:

- `index.css` - Global styles
- `App.css` - App container
- `Chatbot.css` - Main container and error banner
- `ChatHeader.css` - Header styling
- `ChatWindow.css` - Message window and scrolling
- `ChatInput.css` - Input form and button
- `Message.css` - Message bubbles
- `ProductCard.css` - Product card layout

### Design System

#### Color Palette:
```
Primary Gradient: #667eea to #764ba2 (purple)
User Message: Gradient background, white text
Bot Message: Light gray background, dark text
Accent Color: #667eea (buttons, highlights)
Error Color: #c33 (error messages)
```

#### Typography:
```
Font: System fonts (-apple-system, BlinkMacSystemFont, etc.)
Font Sizes: 11px (small), 12px (inputs), 13px (cards), 14px (body), 15px (message), 24px (title)
Weight: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
```

#### Spacing:
```
Small: 4px
Medium: 8px
Large: 12px, 16px, 20px
```

#### Border Radius:
```
Small: 6px, 8px (inputs, buttons)
Medium: 12px (cards)
Large: 16px, 20px (message bubbles)
Circular: 50% (avatar placeholders)
```

### Responsive Breakpoints

Mobile-first approach with breakpoint at 768px:

```css
/* Mobile (default) */
width: 100%;

/* Desktop (768px+) */
@media (max-width: 768px) {
  /* Adjust for mobile */
}
```

## Testing & Debugging

### Browser DevTools

#### Network Tab:
1. Open DevTools (F12)
2. Go to Network tab
3. Send a message
4. Check `/api/chat` request:
   - Status should be 200
   - Response shows products array

#### Console Tab:
- Check for errors in red
- Component logs if debugging enabled
- API error messages

### Common Issues & Solutions

**Issue: "Cannot POST /api/chat"**
- Solution: Check backend is running on correct port
- Check REACT_APP_API_URL in .env

**Issue: CORS error in console**
- Solution: Verify FRONTEND_URL in backend .env
- Restart both frontend and backend

**Issue: Products not displaying**
- Solution: Check API response in Network tab
- Verify Shopify store has products
- Check product images are valid URLs

**Issue: Styling looks broken**
- Solution: Clear browser cache (Ctrl+Shift+Delete)
- Restart React dev server
- Check CSS files are imported

### Performance Debugging

1. Open DevTools Performance tab
2. Record interaction
3. Analyze:
   - Rendering time
   - API call duration
   - Component re-renders

### Code Structure Examples

#### Adding New Message Type:

```javascript
// In useChatbot.js - sendMessage function
const specialMsg = {
  id: `special-${Date.now()}`,
  text: 'Your custom message',
  sender: 'bot',
  timestamp: new Date(),
  customField: 'value' // Add custom data
};

setMessages(prev => [...prev, specialMsg]);
```

#### Modifying Product Card:

```javascript
// In ProductCard.js - add new field
const ProductCard = ({ product }) => {
  const { title, price, image, link, relevanceScore, rating } = product;
  
  return (
    <div className="product-card">
      {/* Add rating display */}
      <div>⭐ {rating}/5</div>
      {/* ... rest of component */}
    </div>
  );
};
```

#### Adding Loading State:

```javascript
// In ChatWindow.js - custom loading message
{isLoading && (
  <div className="custom-loading">
    <p>🔍 Searching for products...</p>
    <ProgressBar />
  </div>
)}
```

## Environment Variables

### Required Variables:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Optional Variables:

```env
REACT_APP_DEBUG=true          # Enable debug logging
REACT_APP_TIMEOUT=30000       # API timeout in ms
```

### Accessing in Code:

```javascript
const apiUrl = process.env.REACT_APP_API_URL;
const isDev = process.env.NODE_ENV === 'development';
```

---

**Last Updated:** January 2024
