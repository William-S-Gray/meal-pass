# Meal Pass Backend

Backend API for the Meal Distribution QR Tracking System.

## Features

- Beneficiary Registration with Unique ID Generation
- QR Code Generation and Management
- Meal Distribution Tracking
- Admin Authentication (Optional)
- CSV Import/Export Functionality
- Comprehensive Statistics and Reporting

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- QR Code Generation

## Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```
   cd backend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file based on `.env.example`
5. Start the server:
   ```
   npm run dev
   ```

## API Endpoints

### Employees
- `POST /api/employees` - Create employee
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get single employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `POST /api/employees/import` - Import employees from CSV
- `GET /api/employees/export` - Export employees (CSV/JSON)

### QR/Feeding
- `POST /api/feed/scan` - Scan QR code and mark as fed
- `GET /api/feed/today` - Get all people fed today
- `GET /api/feed/stats` - Get feeding statistics
- `GET /api/feed/unfed` - Get unfed persons list
- `GET /api/feed/export` - Export feed logs as CSV

### Authentication (Optional)
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current admin info

## Environment Variables

Create a `.env` file in the root of the backend directory with the following variables:

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mealpass
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
ENABLE_AUTH=true
```

## Seeding Data

To seed sample employee data:

```
npm run seed
```

## License

MIT