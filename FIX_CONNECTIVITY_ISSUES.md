# Fix Connectivity Issues - Step by Step Guide

## Current Problem
Your frontend is still trying to connect to `http://localhost:5001` instead of `http://localhost:5000`, causing:
1. WebSocket connection failures
2. Authentication API call failures
3. Backend unreachable errors

## Root Cause
The frontend server is still using cached configuration or hasn't been restarted after the configuration change.

## Solution Steps

### Step 1: Stop All Running Servers
Completely stop both frontend and backend servers:
- Close all terminal/command prompt windows running the servers
- Or press Ctrl+C in each terminal to stop the processes

### Step 2: Clear Browser Cache
1. Open your browser's Developer Tools (F12)
2. Right-click the refresh button and select "Empty Cache and Hard Reload"
3. Or press Ctrl+Shift+Delete to open clear browsing data dialog
4. Select "Cached images and files" and click "Clear data"

### Step 3: Verify Configuration Files
Check that both configuration files are correctly set:

**File: `.env.frontend`**
```
VITE_API_URL=http://localhost:5000
```

**File: `.env.backend`**
```
PORT=5000
```

### Step 4: Restart Backend Server
1. Open a new terminal/command prompt
2. Navigate to the project root directory
3. Run:
```bash
cd backend
npm run dev
```

Wait for the message: "Server running in development mode on port 5000"

### Step 5: Restart Frontend Server
1. Open another new terminal/command prompt
2. Navigate to the project root directory
3. Run:
```bash
cd frontend
npm run dev
```

Wait for the message: "Local: http://localhost:8080/"

### Step 6: Verify the Fix
1. Open your browser and navigate to http://localhost:8080
2. Open Developer Tools (F12)
3. Check the Console tab for these messages:
   - "VITE_API_URL from env: http://localhost:5000"
   - "Using baseURL: http://localhost:5000"
   - "Connected to WebSocket server" (for successful WebSocket connection)

### Step 7: Test Authentication
1. Try to log in with any credentials
2. Check the Network tab in Developer Tools
3. The login request should go to `http://localhost:5000/api/auth/login`
4. You should see a proper response (even if it's a 400/401 error for invalid credentials)

## If Issues Persist

### Check Port Conflicts
Run this command to check if port 5000 is being used:
```bash
netstat -ano | findstr :5000
```

If another process is using port 5000:
1. Identify the process ID (PID) from the output
2. Kill the process: `taskkill /PID <process_id> /F`
3. Or change the backend port in `.env.backend` to 5001 and update `.env.frontend` accordingly

### Verify Backend Health
Check if the backend is responding:
```bash
curl http://localhost:5000/health
```

You should receive a JSON response indicating the server is healthy.

### Check Environment Variable Loading
If the frontend still shows port 5001, there might be another `.env` file:
1. Check for `.env.local`, `.env.development`, or other environment files in the frontend directory
2. Ensure they all have `VITE_API_URL=http://localhost:5000`

## Expected Results After Fix
1. Console should show: "VITE_API_URL from env: http://localhost:5000"
2. WebSocket connections should succeed
3. API calls should go to port 5000
4. Authentication should work (may still fail with 400/401 for invalid credentials, but not with CONNECTION_REFUSED)

## Common Mistakes to Avoid
1. Not restarting servers after configuration changes
2. Not clearing browser cache
3. Having multiple conflicting environment files
4. Not waiting for servers to fully start before testing