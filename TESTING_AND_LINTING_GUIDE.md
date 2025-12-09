# Testing and Linting Guide

## Backend Testing

The backend uses Jest as the testing framework with Supertest for API testing.

### Running Tests

To run all backend tests:
```bash
cd backend
npm test
```

To run a specific test file:
```bash
cd backend
npx jest __tests__/mock-server.test.js
```

### Test Structure

- Tests are located in the `__tests__` directory
- Each test file focuses on specific functionality
- Mock servers can be used for testing without database dependencies

### Writing New Tests

1. Create a new test file in the `__tests__` directory
2. Use Supertest to make HTTP requests to the API
3. Use Jest assertions to verify responses
4. Follow the existing patterns in the codebase

## Frontend Linting

The frontend uses ESLint with TypeScript support for code quality enforcement.

### Running Linting

To run linting on the frontend:
```bash
cd frontend
npm run lint
```

### Linting Configuration

- ESLint configuration is in `eslint.config.js`
- Uses TypeScript ESLint plugin for TypeScript support
- Includes React Hooks and React Refresh plugins
- Configured to ignore the `dist` directory

### Fixing Linting Issues

To automatically fix some linting issues:
```bash
cd frontend
npx eslint . --fix
```

## Continuous Integration

Both testing and linting should be integrated into the CI pipeline to ensure code quality is maintained.

### Recommended CI Setup

1. Run backend tests on every pull request
2. Run frontend linting on every pull request
3. Fail the build if tests don't pass or linting issues are found
4. Generate coverage reports for tests