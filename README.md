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
  - **Household Identifier → now called: Unique Employee Code**
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
2. Install Backend
bash
Copy code
cd backend
npm install
3. Install Frontend
bash
Copy code
cd ../frontend
npm install
4. Environment Variables
🖥️ Backend .env
ini
Copy code
PORT=5000
MONGODB_URI=your_mongo_url_here
JWT_SECRET=your_secure_secret_here
JWT_EXPIRE=30d
ENABLE_AUTH=true

<<<<<<< HEAD
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
=======
# Deployment
FRONTEND_URL=https://your-frontend.onrender.com
BASE_URL=https://your-backend.onrender.com
🌐 Frontend .env
ini
Copy code
VITE_API_URL=https://your-backend.onrender.com
🎬 Start Development
bash
Copy code
>>>>>>> 25b2993b7bc691625ef018f2a1ef11a8207140c1
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
📡 API Routes Summary
🔐 Authentication
Method	Route	Description
POST	/api/auth/login	Employee/admin login

👤 Employees
Method	Route	Description
GET	/api/employees	All employees (paginated)
POST	/api/employees	Register employee
PUT	/api/employees/:id	Update employee
DELETE	/api/employees/:id	Remove employee
GET	/api/employees/:id/qrcode	Download QR/Barcode
GET	/api/employees/uid/:uid	Search by Unique Employee Code

🍽️ Feeding
Method	Route	Description
POST	/api/feeding/scan	Scan for feeding
GET	/api/feeding/today	Today's feeding
GET	/api/feeding/employee/:uid	History
DELETE	/api/feeding/record/:uid	Remove feed record

🔒 Security
QR/Barcode secured with encrypted UID

JWT authentication with expiration

Role-based access

Request validation

MongoDB injection prevention

Helmet security headers

Rate limiting

🛠️ Technologies & Tools
Category	Tools
Backend	Node.js, Express.js, MongoDB
Frontend	React, Vite, Tailwind, ShadCN UI
Auth	JWT, bcrypt
Scanning	HTML5 camera APIs, QR/Barcode generation
Reports	Dynamic charts, CSV/PDF exports

📤 Deployment (Render)
Backend → Web Service
Frontend → Static Site

👉 Follow configurations as previously documented:

Build commands

<<<<<<< HEAD
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
=======
Publish directory (dist)

CORS whitelist must include frontend URL

Enable static QR/Barcode access via public directory

🎨 Branding
Element	Name
Organization	Africa Accommodation Providers
System	Meal-Pass Employee Feeding System
ID Type	Employee Meal ID

🤝 Contributing
We welcome feature improvements & bug fixes.

Fork → 2. Branch → 3. Commit → 4. Pull Request.

📄 License
MIT License — Free for personal and commercial use.

🆘 Support
For issues or requests, open a GitHub issue or contact the development team.
>>>>>>> 25b2993b7bc691625ef018f2a1ef11a8207140c1
