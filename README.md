# Meal-Pass MERN Feeding Management System

A comprehensive meal distribution system with QR code tracking for beneficiaries, built with the MERN stack (MongoDB, Express, React, Node.js).

## 🏗️ System Architecture

### Backend Structure
```
backend/
├── config/          # Database and environment configuration
├── controllers/     # Request handlers
├── services/        # Business logic layer
├── models/          # Database models
├── routes/          # API route definitions
├── middleware/      # Custom middleware
├── validators/      # Request validation schemas
├── utils/           # Utility functions
├── public/          # Static files (QR codes, images)
└── server.js        # Application entry point
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── ui/         # Primitive components (from shadcn/ui)
│   │   └── layout/     # Layout components
│   ├── pages/          # Page components (routes)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # API clients and utilities
│   ├── contexts/       # React contexts
│   ├── utils/          # Helper functions
│   └── styles/         # CSS and styling
├── public/             # Static assets
└── index.html          # HTML entry point
```

## 🔧 Key Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Volunteer, Reporter)
- Secure password hashing with bcrypt

### Beneficiary Management
- Create, read, update, delete beneficiaries
- Automatic QR code generation
- Unique ID assignment
- Photo upload support
- Bulk operations

### Feeding Tracking
- QR code scanning for meal distribution
- Manual feeding entry
- Real-time updates with WebSocket
- Duplicate feeding prevention
- Daily feeding records

### Reporting & Analytics
- Daily feeding reports
- Date range reporting
- Statistical dashboards
- Export to CSV/PDF

### Printing & Export
- Individual beneficiary card printing
- Bulk card printing (up to 40 cards per sheet)
- QR code download

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd meal-pass
```

2. **Install backend dependencies:**
```bash
cd backend
npm install
```

3. **Install frontend dependencies:**
```bash
cd ../frontend
npm install
```

4. **Set up environment variables:**
```bash
# Backend (.env)
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mealpass
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d
ENABLE_AUTH=false
FRONTEND_URL=http://localhost:8080

# Frontend (.env)
VITE_API_URL=http://localhost:5000
```

5. **Start the development servers:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📡 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Beneficiaries
- `GET /api/beneficiaries` - Get all beneficiaries (paginated)
- `POST /api/beneficiaries` - Create new beneficiary
- `GET /api/beneficiaries/:id` - Get beneficiary by ID
- `GET /api/beneficiaries/uid/:uid` - Get beneficiary by unique ID
- `PUT /api/beneficiaries/:id` - Update beneficiary
- `DELETE /api/beneficiaries/:id` - Delete beneficiary
- `GET /api/beneficiaries/:id/qrcode` - Download QR code

### Feeding
- `POST /api/feeding/scan` - Record feeding event
- `GET /api/feeding/today` - Get today's feeding records
- `GET /api/feeding/beneficiary/:uniqueId` - Get feeding records for beneficiary
- `DELETE /api/feeding/record/:uniqueId` - Remove today's feeding record

### Reports
- `GET /api/reports/today` - Get today's report
- `GET /api/reports/date-range` - Get date range report
- `GET /api/reports/beneficiary/:uniqueId` - Get beneficiary report
- `GET /api/reports/statistics` - Get statistics

## 🔒 Security Features

- Input validation and sanitization
- JWT authentication with expiration
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Helmet.js security headers
- MongoDB injection prevention

## 📈 Performance Optimizations

- Database indexing for faster queries
- Pagination for large datasets
- Caching strategies
- Lazy loading components
- Code splitting
- Image optimization

## 🛠️ Development Guidelines

### Coding Standards
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Consistent naming conventions
- Modular, reusable components
- Comprehensive error handling

### Git Workflow
- Feature branching
- Pull requests with code review
- Semantic commit messages
- Automated testing

### Testing
- Unit tests with Jest
- Integration tests
- End-to-end tests with Cypress

## 🎨 UI/UX Features

- Responsive design
- Dark/light mode support
- Real-time notifications
- Intuitive navigation
- Accessible components
- Loading states and skeletons

## 📤 Deployment

### Production Build
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
```

### Environment Configuration
- Production database connection
- Secure JWT secrets
- HTTPS enforcement
- CDN for static assets

### Deploying to Render

#### Prerequisites
1. Create a Render account at [render.com](https://render.com)
2. Set up MongoDB Atlas or another MongoDB hosting service
3. Prepare your environment variables

#### Backend Deployment (Web Service)
1. Go to your Render dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `mealpass-backend`
   - **Environment**: Node
   - **Branch**: main (or your deployment branch)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_secure_jwt_secret_here
   JWT_EXPIRE=30d
   ENABLE_AUTH=true
   FRONTEND_URL=https://your-frontend-url.onrender.com
   BASE_URL=https://your-backend-service-name.onrender.com
   ```

#### Frontend Deployment (Static Site)
1. Go to your Render dashboard
2. Click "New" → "Static Site"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `mealpass-frontend`
   - **Branch**: main (or your deployment branch)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

5. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend-service-name.onrender.com
   ```

#### Post-Deployment Steps
1. Update the backend CORS configuration with your frontend URL
2. Test the connection between frontend and backend
3. Verify all API endpoints are working correctly
4. Check that QR codes are being generated and served properly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please open an issue on the GitHub repository or contact the development team.