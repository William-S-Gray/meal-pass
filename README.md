# 🍽️ Meal-Pass Employee Feeding System (AAP)

A comprehensive meal distribution system with QR code tracking for employees, built with the MERN stack (MongoDB, Express, React, Node.js).
A smart feeding access and tracking system for employees powered by Africa Accommodation Providers (AAP). Built using the MERN stack (MongoDB, Express, React, Node.js) with secure QR/Barcode access, real-time tracking, and ID card printouts.

## 🏢 Business Context

**Africa Accommodation Providers (AAP)** serves meals to employees based on verified eligibility.  
This system ensures:

✔ Only valid employees access feeding  
✔ Scannable **Employee Meal ID** (QR + Barcode)  
✔ Access denied if feeding period is expired  
✔ Digital record to prevent double feeding  
✔ Real-time reporting for admins

## 🏗️ System Architecture

### Backend Structure

backend/

├── config/ # Database & environment config

├── controllers/ # Route business handlers

├── services/ # Core business logic

├── models/ # MongoDB schemas

├── routes/ # API routes

├── middleware/ # Auth, validations, security

├── validators/ # Joi/Yup validation schemas

├── utils/ # QR, barcode, ID generation, helpers

├── public/ # Static (QR/Barcodes, ID templates)

└── server.js # Entry point

### Frontend Structure
frontend/

├── src/

│ ├── components/ # UI parts

│ │ ├── ui/ # shadcn/ui primitives

│ │ └── layout/ # Navigation, dashboard, modals

│ ├── pages/ # Page views & routing

│ ├── hooks/ # Custom hooks

│ ├── lib/ # API calls

│ ├── contexts/ # Auth & state management

│ ├── utils/ # QR/Barcode helpers

│ └── styles/ # Tailwind/CSS

├── public/ # Static assets

└── index.html # App root

## 🔧 Key Features

### 🛂 Employee Management
- Register employees with:
  - Full name
  - Position/Department
  - **Unique Employee Code**
  - Validity period (start & end date)
  - ID photo upload
- Automatic:
  - **Employee Meal ID Generation**
  - **QR code + Barcode**
  - Unique tracking ID

### Employee Management
- Create, read, update, delete employees
- Automatic QR code generation
- Unique ID assignment
- Photo upload support
- Bulk operations
### 🍽️ Feeding Access & Tracking
- Scan at checkpoint using phone/camera/device
- Verify:
  - Identity
  - **Validity period**
  - **Already fed or not**
- Real-time prevention of duplicate feeding
- Manual feeding option

### 💳 ID Card Printing
- **Horizontal ATM card style (Standard size)**
- Contains:
  - Employee name
  - Unique Employee Code
  - Validity dates
  - QR Code + Barcode
  - AAP branding
- Export ready for printing & lamination

### 📊 Reporting & Analytics
- Daily, weekly & date-range reports
- Employee-specific history
- Total meals served
- Usage statistics
- Export to CSV/PDF

### Printing & Export
- Individual employee card printing
- Bulk card printing (up to 40 cards per sheet)
- QR code download

## 🚀 Getting Started

### 📌 Prerequisites
- Node.js ≥ 16
- MongoDB or MongoDB Atlas
- npm or yarn

### 🔧 Installation

#### 1. Clone
```bash
git clone <repository-url>
cd meal-pass
```

#### 2. Install Backend
```bash
cd backend
npm install
```

#### 3. Install Frontend
```bash
cd ../frontend
npm install
```

#### 4. Environment Variables

**Backend .env**
```ini
PORT=5000
MONGODB_URI=your_mongo_url_here
JWT_SECRET=your_secure_secret_here
JWT_EXPIRE=30d
ENABLE_AUTH=true
```

**Frontend (.env)**
```ini
VITE_API_URL=http://localhost:5000
```

#### 5. **Start the development servers:**
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
- Role-based access control (Admin, Volunteer, Reporter)
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Secure HTTP headers

## 🎨 UI/UX Features

- Responsive design for all device sizes
- Dark/light mode support
- Real-time updates with WebSocket
- Toast notifications
- Loading states and skeleton screens
- Accessible UI components
- Keyboard navigation support

## 📱 Mobile Features

- Camera-based QR scanning
- Manual entry fallback
- Offline capability for basic operations
- Touch-friendly interface
- Fast loading times

## 🖨️ Printing Features

- Individual employee card printing
- Bulk card printing (up to 40 cards per sheet)
- QR code download
- Standard ID card size (85mm x 55mm)
- Printable in both portrait and landscape orientations

## 📈 Analytics & Reporting

- Real-time dashboard
- Daily/weekly/monthly statistics
- Employee feeding history
- Export to CSV/PDF
- Visual charts and graphs
- Custom date range filtering

## 👥 User Roles

### Admin
- Full system access
- Employee management
- Report generation
- System configuration

### Volunteer
- Employee registration
- QR scanning
- Manual entry
- Basic reporting

### Reporter
- View reports
- Export data
- No modification rights

## 🛠️ Development Features

- Hot reloading
- TypeScript support
- ESLint and Prettier
- Husky pre-commit hooks
- Docker support
- CI/CD ready
- Comprehensive test suite

## 🐳 Docker Deployment

### Using Docker Compose
```bash
docker-compose up --build
```

### Production Deployment
```bash
docker-compose -f docker-compose.prod.yml up --build
```

## ☁️ Cloud Deployment

### Render.com
- Ready for one-click deployment
- Environment variables configured
- Automatic SSL

### Other Platforms
- Heroku
- AWS
- Google Cloud
- Azure

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Test Coverage
- Unit tests for services
- Integration tests for controllers
- End-to-end tests for critical flows
- API contract testing

## 📚 Documentation

### Code Documentation
- JSDoc for backend functions
- TypeScript interfaces
- Component prop documentation

### User Guides
- Admin manual
- Volunteer guide
- Reporter handbook

### Technical Documentation
- API specification
- Database schema
- Architecture diagrams
- Deployment guides

## 🆘 Troubleshooting

### Common Issues
- Camera permissions
- Network connectivity
- Database connection
- Authentication errors

### Debugging Tools
- Browser developer tools
- MongoDB Compass
- Postman for API testing
- Logging utilities

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Africa Accommodation Providers for the project opportunity
- MERN stack community
- shadcn/ui for beautiful components
- All contributors and testers