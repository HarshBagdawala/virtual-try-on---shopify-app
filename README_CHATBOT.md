# 🤖 AI-Powered Product Recommendation Chatbot for Shopify

A full-stack chatbot application that uses OpenAI's GPT-4 mini model to intelligently recommend Shopify products based on natural language queries.

## 📋 Features

- ✅ **Natural Language Processing** - Use AI to understand user queries and extract product intent
- ✅ **Smart Product Filtering** - Intelligent matching based on keywords, categories, price ranges, and features
- ✅ **Real-time Recommendations** - Display top 3 relevant products with prices and images
- ✅ **Beautiful UI** - Modern, responsive chatbot interface with product cards
- ✅ **Error Handling** - Graceful error messages and fallback mechanisms
- ✅ **Loading States** - Visual feedback during API processing
- ✅ **Mobile Responsive** - Fully functional on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

### Backend
- **Express.js** - REST API server
- **Axios** - HTTP client for API calls
- **OpenAI API** - GPT-4 mini model for NLP
- **Shopify Admin API** - Product data retrieval
- **Node.js** - Runtime environment

### Frontend
- **React** - UI library with functional components and hooks
- **Axios** - API communication
- **CSS3** - Responsive styling with gradients and animations

## 📁 Project Structure

```
harshapp/
├── backend/
│   ├── server.js                 # Express server entry point
│   ├── package.json              # Backend dependencies
│   ├── .env.example              # Environment variables template
│   ├── routes/
│   │   └── chat.js               # POST /api/chat endpoint
│   ├── services/
│   │   └── productFilter.js      # Product filtering and ranking logic
│   └── utils/
│       ├── logger.js             # Logging utility
│       ├── shopifyClient.js      # Shopify Admin API integration
│       └── openaiClient.js       # OpenAI API integration
│
├── frontend/
│   ├── package.json              # Frontend dependencies
│   ├── .env.example              # Environment variables template
│   ├── public/
│   │   └── index.html            # HTML entry point
│   └── src/
│       ├── index.js              # React DOM render
│       ├── App.js                # Main App component
│       ├── components/
│       │   ├── Chatbot.js        # Main chatbot orchestrator
│       │   ├── ChatHeader.js     # Header with title and clear button
│       │   ├── ChatWindow.js     # Message display area
│       │   ├── ChatInput.js      # User input field
│       │   ├── Message.js        # Individual message component
│       │   └── ProductCard.js    # Product display card
│       ├── hooks/
│       │   └── useChatbot.js     # Custom hook for chat state management
│       ├── services/
│       │   └── api.js            # Backend API communication
│       └── styles/
│           ├── index.css         # Global styles
│           ├── App.css           # App container
│           ├── Chatbot.css       # Main chatbot styles
│           ├── ChatHeader.css    # Header styles
│           ├── ChatWindow.css    # Window styles
│           ├── ChatInput.css     # Input styles
│           ├── Message.css       # Message styles
│           └── ProductCard.css   # Product card styles
```

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ and npm
- Shopify store with Admin API access
- OpenAI API key

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Edit .env with your credentials:
# SHOPIFY_STORE=your-store.myshopify.com
# SHOPIFY_ACCESS_TOKEN=shppa_xxx...
# OPENAI_API_KEY=sk-xxx...
# PORT=5000
# FRONTEND_URL=http://localhost:3000

# Start the backend server (development with auto-reload)
npm run dev

# Or start production server
npm start
```

The backend will be available at `http://localhost:5000/api`

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Edit .env:
# REACT_APP_API_URL=http://localhost:5000/api

# Start the development server
npm start
```

The frontend will open at `http://localhost:3000`

## 🔑 Environment Variables

### Backend (.env)
```env
# Shopify Configuration
SHOPIFY_STORE=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shppa_your_token_here

# OpenAI Configuration
OPENAI_API_KEY=sk_your_api_key_here

# Server Configuration
PORT=5000
DEBUG=false

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
# Backend API URL
REACT_APP_API_URL=http://localhost:5000/api
```

## 📡 API Documentation

### POST /api/chat

**Request Body:**
```json
{
  "message": "Show me face wash under 500"
}
```

**Response:**
```json
{
  "query": "Show me face wash under 500",
  "intent": {
    "category": "face wash",
    "keywords": ["face wash", "facial cleanser"],
    "priceRange": {"min": 0, "max": 500},
    "features": ["affordable", "under budget"]
  },
  "products": [
    {
      "id": "gid://shopify/Product/123",
      "title": "Gentle Face Wash 100ml",
      "price": "299",
      "image": "https://example.com/image.jpg",
      "link": "https://your-store.com/products/gentle-face-wash",
      "relevanceScore": 92.5
    }
  ],
  "message": "Found 3 products matching your request",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:**
```json
{
  "error": "Invalid OpenAI API key",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /health

Health check endpoint to verify backend is running.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🧠 How It Works

### 1. **User Query Processing**
- User types a natural language query (e.g., "face wash under 500")
- Frontend sends query to backend via POST `/api/chat`

### 2. **Intent Analysis (OpenAI)**
- Backend calls OpenAI's GPT-4 mini model
- Model extracts:
  - Product category (e.g., "face wash")
  - Keywords for matching
  - Price range if mentioned
  - Specific features needed

### 3. **Product Fetching (Shopify)**
- Backend fetches up to 100 products from Shopify Admin API
- Gets title, price, image, and product handle

### 4. **Intelligent Filtering & Ranking**
- Each product is scored on relevance:
  - Category match: 40 points
  - Keyword match: 40 points
  - Features match: 15 points
  - Price range filter: 5 points bonus
- Top 3 products returned sorted by relevance score

### 5. **UI Display**
- Frontend receives product list
- Displays in beautiful product cards with:
  - Product image
  - Title
  - Price
  - Relevance score
  - "Buy Now" button (links directly to product)

## 🎯 Example Queries

Try these natural language queries in the chatbot:

```
"Show me face wash under 500"
"Best shampoo for hair fall"
"Affordable moisturizer cream"
"Phone under 30000"
"Premium skincare products"
"Budget-friendly face masks"
"Anti-dandruff shampoo"
"Vitamin C serum"
```

## 🔧 Customization

### Adjust Product Ranking Weights

Edit [backend/services/productFilter.js](backend/services/productFilter.js):

```javascript
// Current weights: Category 40%, Keywords 40%, Features 15%, Price 5%
const categoryWeight = 40;
const keywordWeight = 40;
const featureWeight = 15;
const priceWeight = 5;
```

### Change Number of Products Returned

Edit [backend/routes/chat.js](backend/routes/chat.js):

```javascript
// Default is 3, change topN parameter
const topProducts = filterAndRankProducts(allProducts, intent, 3);
```

### Modify UI Theme

Edit [frontend/src/styles/](frontend/src/styles/):

```css
/* Primary gradient colors in all CSS files */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

## 🐛 Troubleshooting

### Backend Issues

**Error: "SHOPIFY_STORE and SHOPIFY_ACCESS_TOKEN are required"**
- Ensure your `.env` file exists in the backend folder
- Check that `SHOPIFY_STORE` and `SHOPIFY_ACCESS_TOKEN` are correctly set

**Error: "Invalid OpenAI API key"**
- Verify your `OPENAI_API_KEY` is correct and starts with `sk-`
- Check API key has sufficient credits/permissions

**Error: "Failed to fetch products from Shopify"**
- Verify Shopify access token is valid
- Confirm store name format: `store-name.myshopify.com`
- Check Shopify API scope includes `read_products`

### Frontend Issues

**CORS errors in browser console**
- Backend not running? Start with `npm run dev` in backend folder
- Check `REACT_APP_API_URL` in frontend `.env` matches backend URL
- Verify `FRONTEND_URL` in backend `.env` is set correctly for CORS

**Products not loading**
- Check network tab in browser DevTools for API errors
- Look at backend console for error details
- Ensure at least one product exists in Shopify store

**Styling issues**
- Clear browser cache (Ctrl+Shift+Delete)
- Restart React dev server: `npm start`
- Check all CSS files are imported in components

## 📊 Performance Considerations

- **Product Caching**: Currently fetches products on each request. Consider adding caching for high-traffic scenarios
- **Pagination**: Fetches up to 100 products. Implement pagination for stores with 1000+ products
- **Rate Limiting**: Add rate limiting for API endpoints to prevent abuse
- **Message History**: Currently stored in React state. Use localStorage or database for persistence

## 🔐 Security Notes

- **API Keys**: Never commit `.env` files to git
- **HTTPS**: Use HTTPS in production
- **CORS**: Configure CORS whitelist instead of accepting all requests
- **Input Validation**: All user inputs are validated before processing
- **Error Messages**: Avoid exposing sensitive info in error messages

## 📝 Future Enhancements

- [ ] Add product comparison feature
- [ ] User chat history and preferences
- [ ] Advanced filters (brand, ratings, reviews)
- [ ] Multi-language support
- [ ] Voice input integration
- [ ] Product stock checking
- [ ] Recommendation history
- [ ] Admin dashboard for analytics

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review backend console logs
3. Check browser DevTools console
4. Verify all environment variables are set correctly

---

**Last Updated:** January 2024
**Version:** 1.0.0
