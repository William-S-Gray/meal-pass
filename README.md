# Meal-Pass MERN Feeding Management System

A comprehensive meal distribution system with QR code tracking for employees, built with the MERN stack (MongoDB, Express, React, Node.js).

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

### Employee Management
- Create, read, update, delete employees
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
- Individual employee card printing
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

### Employees
- `GET /api/employees` - Get all employees (paginated)
- `POST /api/employees` - Create new employee
- `GET /api/employees/:id` - Get employee by ID
- `GET /api/employees/uid/:uid` - Get employee by unique ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/:id/qrcode` - Download QR code

### Feeding
- `POST /api/feeding/scan` - Record feeding event
- `GET /api/feeding/today` - Get today's feeding records
- `GET /api/feeding/employee/:uniqueId` - Get feeding records for employee
- `DELETE /api/feeding/record/:uniqueId` - Remove today's feeding record

### Reports
- `GET /api/reports/today` - Get today's report
- `GET /api/reports/date-range` - Get date range report
- `GET /api/reports/employee/:uniqueId` - Get employee report
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

# Meal Tracking System for Africa Accommodation Providers

This is a comprehensive meal tracking system designed for Africa Accommodation Providers to manage employee meals using QR/Barcode scanning technology.

## Features

- Employee registration with unique identifiers
- QR code generation for each employee
- Expiration date validation for employee access
- Mobile-responsive QR scanner for meal distribution
- Printable employee ID cards
- Real-time feeding status tracking
- Comprehensive reporting and analytics

## System Requirements

### Employee Registration

During employee registration, administrators must fill in the following information:

- Full Name
- Unique Identifier
- Validity Period (validUntil date)
- Optional fields:
  - Phone Number
  - Department
  - Position
  - Photo

### Validation Rules

- The system validates the validity period before allowing any employee to be fed
- Expired employees are blocked with an alert message: "Employee meal access expired"
- Duplicate unique identifiers are prevented during registration

### ID Card Generation

Generated employee ID cards include:

- Business Name: Africa Accommodation Providers
- Employee Name
- Unique Identifier
- Validity Date
- QR Code (representing the Unique Identifier)

ID cards are printable in ID card format (300px width).

### QR/Barcode Scanner

The scanner works on:

- Mobile devices
- Dedicated barcode scanners
- Manual entry option

### User Interface

- Login Page shows business header: "Africa Accommodation Providers - Meal Track System"
- Dashboard displays: "Africa Accommodation Providers" and logged-in user name

## Technical Architecture

### Backend

- Node.js + Express
- MongoDB with Mongoose
- RESTful API design
- JWT-based authentication
- QR code generation with qrcode library
- PDF generation for ID cards

### Frontend

- React with TypeScript
- Tailwind CSS for styling
- shadcn/ui components
- Responsive design for all device sizes
- QR scanner library for barcode scanning

### Database Collections

- `employees` - Employee records with validity dates
- `feedingrecords` - Meal feeding logs
- `admins` - System administrator accounts

### API Endpoints

#### Employee Management
- `POST /api/employees` - Register new employee
- `GET /api/employees` - List all employees
- `GET /api/employees/:id` - Get employee by ID
- `GET /api/employees/uid/:uid` - Get employee by unique ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/:id/qrcode` - Download employee QR code
- `GET /api/employees/:id/qrcode/dataurl` - Get QR code as DataURL

#### Feeding Management
- `POST /api/feeding/scan` - Record employee meal
- `GET /api/feeding/today` - Get today's feeding records
- `GET /api/feeding/employee/:uniqueId` - Get feeding records for employee
- `DELETE /api/feeding/record/:uniqueId` - Remove today's feeding record

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

#### Reporting
- `GET /api/reports/today` - Daily report
- `GET /api/reports/date-range` - Date range report
- `GET /api/reports/employee/:uniqueId` - Employee-specific report
- `GET /api/reports/statistics` - System statistics

## Testing

The system includes comprehensive test suites covering:

- Validity period checking (not expired → Meal allowed)
- Expiration blocking (expired → Meal blocked)
- Duplicate unique identifier prevention
- QR scan validation for valid employees
- Printed ID card content verification

## Deployment

The system is containerized with Docker and can be deployed to cloud platforms like Render or Heroku.

## Contributing

Contributions are welcome! Please fork the repository and submit pull requests.

## License

MIT License
