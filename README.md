# 🍽️ Meal-Pass Employee Feeding System (AAP)

A smart feeding access and tracking system for employees powered by Africa Accommodation Providers (AAP). Built using the MERN stack (MongoDB, Express, React, Node.js) with secure QR/Barcode access, real-time tracking, and ID card printouts.

---

## 🏢 Business Context

**Africa Accommodation Providers (AAP)** serves meals to employees based on verified eligibility.  
This system ensures:

✔ Only valid employees access feeding  
✔ Scannable **Employee Meal ID** (QR + Barcode)  
✔ Access denied if feeding period is expired  
✔ Digital record to prevent double feeding  
✔ Real-time reporting for admins

---

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

shell
Copy code

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

markdown
Copy code

---

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

---

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
