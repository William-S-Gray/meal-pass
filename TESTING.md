# Meal Pass - Testing Documentation

This document provides instructions for running all tests for the Meal Pass application.

## Backend Tests (Jest + Supertest)

### Prerequisites
- MongoDB running locally or accessible database
- Node.js installed

### Running Tests

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Run all tests:
```bash
npm test
```

4. Run tests in watch mode:
```bash
npm run test:watch
```

### Test Coverage
Tests cover:
- Authentication API
- Beneficiaries API
- Feeding API
- Reports API
- Utility functions

## Frontend Tests (Cypress E2E)

### Prerequisites
- Application running locally (both frontend and backend)
- Node.js installed

### Running Tests

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Run tests in headless mode:
```bash
npm test
```

4. Run tests with Cypress UI:
```bash
npm run test:open
```

### Test Coverage
E2E tests cover:
- Login flow
- Beneficiary management
- Card printing
- QR scanning
- Reports generation
- Dashboard navigation

## Test Data Seeding

To seed test data:
```bash
node seedTestData.js
```

This will create:
- 1 admin user
- 30 test beneficiaries
- 50 feeding records

## Continuous Integration

For CI environments, run:
```bash
# Backend tests
cd backend && npm test

# Frontend tests (requires services to be running)
cd frontend && npm test
```