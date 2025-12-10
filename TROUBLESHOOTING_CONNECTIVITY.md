# Connectivity Troubleshooting Guide

This guide helps resolve the WebSocket and connectivity issues you're experiencing with the Meal Pass application.

## Current Issues Identified

From your console output, we can see:

1. **Port Configuration Mismatch**: Frontend was trying to connect to port 5001, but backend runs on port 5000
2. **WebSocket Connection Failures**: Multiple WebSocket errors due to incorrect configuration
3. **Vite HMR Issues**: Hot Module Replacement WebSocket connection failing
4. **Backend Unreachable**: Authentication API calls failing

## Fixes Applied

We've already corrected the configuration:

1. **Frontend `.env.frontend`**: Set `VITE_API_URL=http://localhost:5000`
2. **Backend `.env.backend`**: Confirmed `PORT=5000`

## Next Steps to Resolve Remaining Issues

### 1. Restart Both Servers

Stop both frontend and backend servers completely, then restart them:

**Backend (in one terminal):**
```bash
cd backend
npm run dev
# or
node server.js
```

**Frontend (in another terminal):**
```bash
cd frontend
npm run dev
```

### 2. Verify Backend is Running

Check that the backend responds to health checks:
```bash
curl http://localhost:5000/health
```

You should see a response like:
```json
{
  "status": "OK",
  "timestamp": "2025-12-10T14:15:10.751Z",
  "uptime": 283.7500002,
  "environment": "unknown",
  "database": {
    "status": "connected",
    "readyState": 1
  },
  "system": {
    "memory": {
      "rss": "83 MB",
      "heapTotal": "41 MB",
      "heapUsed": "37 MB"
    },
    "pid": 11612
  }
}
```

### 3. Check WebSocket Configuration

The WebSocket connection should now work since we've aligned the ports. However, if you still see WebSocket errors:

1. **Clear Browser Cache**: Hard refresh your browser (Ctrl+F5)
2. **Check Browser Console**: Look for any remaining WebSocket errors
3. **Verify CORS Settings**: Ensure your backend allows connections from `http://localhost:8080`

### 4. Authentication Flow Test

Try logging in again. The authentication should now work since:
- Frontend connects to the correct backend URL
- Backend is accessible on port 5000
- WebSocket connections should establish properly

## Common Issues and Solutions

### Issue: WebSocket Connection Still Failing
**Solution**: 
1. Check that your frontend is accessing `http://localhost:8080`
2. Ensure backend CORS settings allow `http://localhost:8080`
3. Clear browser cache and cookies for localhost

### Issue: Authentication Fails After Login
**Solution**:
1. Check browser storage for user token after login
2. Verify JWT_SECRET is consistent between login and protected route access
3. Check browser network tab for detailed error responses

### Issue: Performance Monitoring Not Working
**Solution**:
1. Ensure backend is running with `PERFORMANCE_DEBUG=true` if you want detailed logs
2. Check browser console for performance debug messages
3. Verify the Edit Employee page shows performance metrics

## Testing Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 8080
- [ ] Health check endpoint accessible: `http://localhost:5000/health`
- [ ] Authentication endpoint accessible: `http://localhost:5000/api/auth/login`
- [ ] WebSocket connection established in browser console
- [ ] Performance monitoring logs appearing in browser console
- [ ] Edit Employee page loads with performance metrics

## Advanced Troubleshooting

If issues persist:

1. **Check Firewall**: Ensure Windows Firewall allows connections on ports 5000 and 8080
2. **Process Conflicts**: Verify no other processes are using these ports
3. **MongoDB Connection**: Confirm MongoDB is running and accessible
4. **Environment Variables**: Double-check all .env files are loaded correctly

## Verification Commands

Run these commands to verify your setup:

```bash
# Check if backend is listening
netstat -ano | findstr :5000

# Check if frontend is listening
netstat -ano | findstr :8080

# Test backend health endpoint
curl http://localhost:5000/health

# Test authentication endpoint (should return 400 for bad request, not connection refused)
curl -X POST http://localhost:5000/api/auth/login
```

## Expected Behavior After Fixes

1. **Browser Console**: Should show successful WebSocket connections
2. **Network Tab**: API calls should succeed with 200 responses
3. **Performance Logs**: Should show detailed performance metrics in console
4. **Application Functionality**: All features should work without connection errors

If you continue to experience issues after following these steps, please share the new console output for further diagnosis.