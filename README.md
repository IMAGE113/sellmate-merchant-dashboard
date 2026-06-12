# SellMate Merchant Dashboard

A production-ready merchant dashboard for SellMate AI, built with React 19, TypeScript, TailwindCSS, and shadcn/ui.

## Features

### 🔐 Authentication
- JWT-based login system
- Secure token storage and auto-session restore
- Protected routes with automatic redirect

### 📊 Dashboard Overview
- Key metrics cards (Total Orders, Revenue, Pending Orders, Products)
- Revenue trend chart
- Top products widget
- Recent orders table

### 📦 Orders Management
- Full orders table with search and filtering
- Status-based filtering (Pending, Processing, Completed, Cancelled)
- Pagination support
- Mobile-responsive card view

### 🛍️ Products Management
- Product listing with search
- Status filtering (Active/Inactive)
- Pagination
- Prepared architecture for edit/delete operations

### 📈 Analytics
- Revenue trend visualization
- Orders trend analysis
- Combined overview charts
- Real-time data updates

### ⚙️ Settings
- **Profile Section**: View shop information and shop ID
- **AI Requirements**: Edit business rules and custom instructions
- **Telegram Bot Setup**: Connect and verify Telegram bot
- **Security**: Change password functionality

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS 4 + shadcn/ui
- **HTTP Client**: Axios with JWT interceptors
- **Charts**: Recharts
- **Routing**: Wouter
- **Notifications**: Sonner
- **State Management**: React Context + Hooks

## Project Structure

```
client/
├── src/
│   ├── pages/           # Page components (Login, Dashboard, Orders, etc.)
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts (Auth, Theme)
│   ├── lib/            # API service layer
│   ├── App.tsx         # Main app with routing
│   ├── main.tsx        # React entry point
│   └── index.css       # Global styles
├── public/             # Static assets
└── index.html          # HTML template
```

## Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run check
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_BASE_URL=https://sellmate-ai-backend.onrender.com/api
```

## API Integration

The dashboard connects to the SellMate AI backend with the following endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-token` - Token verification
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/merchant/requirements/{shop_id}` - Update requirements

### Dashboard
- `GET /api/dashboard/overview` - Dashboard overview data
- `GET /api/dashboard/orders` - List orders
- `GET /api/dashboard/orders/{order_id}` - Get order details
- `GET /api/dashboard/products` - List products
- `GET /api/dashboard/analytics` - Analytics data
- `GET /api/dashboard/profile` - User profile
- `POST /api/dashboard/settings` - Update settings

## Features Implemented

✅ JWT Authentication with auto-session restore
✅ Protected routes with automatic redirect
✅ Dashboard overview with key metrics
✅ Orders management with search and filtering
✅ Products listing with pagination
✅ Analytics with Recharts visualizations
✅ Settings page with profile, requirements, Telegram setup
✅ Responsive design (mobile-first)
✅ Dark mode by default
✅ Error handling and loading states
✅ Toast notifications
✅ TypeScript strict mode
✅ Production-ready build

## Future Enhancements

- [ ] Real-time notifications with WebSocket
- [ ] Batch operations for orders/products
- [ ] Advanced filtering and sorting
- [ ] Export data to CSV/PDF
- [ ] User activity logs
- [ ] API rate limiting display
- [ ] Dark/Light theme toggle

## Security

- JWT tokens stored securely in localStorage
- Automatic token refresh on 401 responses
- Protected API routes with authentication
- CORS-enabled API communication
- XSS protection through React's built-in sanitization

## Performance

- Code splitting with dynamic imports
- Lazy loading of routes
- Optimized bundle size
- Efficient re-renders with React hooks
- Cached API responses

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Support

For issues and feature requests, please contact the SellMate AI team.
