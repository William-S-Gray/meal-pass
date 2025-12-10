@echo off
echo ========================================
echo MEAL PASS - CONFIGURATION VERIFICATION
echo ========================================
echo.

echo Checking frontend configuration files:
echo ----------------------------------------
echo .env.frontend:
type .env.frontend
echo.
echo frontend\.env:
type frontend\.env
echo.
echo frontend\.env.development:
type frontend\.env.development
echo.

echo Checking backend configuration:
echo ----------------------------------------
echo .env.backend:
type .env.backend
echo.

echo Checking if backend is running:
echo ----------------------------------------
netstat -ano ^| findstr :5000
echo.

echo Checking if conflicting ports are in use:
echo ----------------------------------------
netstat -ano ^| findstr :5001
echo.

echo ========================================
echo CONFIGURATION CHECK COMPLETE
echo ========================================
echo If all configurations show port 5000 and
echo backend is listening on port 5000, then
echo the issue is likely browser cache.
echo.
echo SOLUTION:
echo 1. Stop all servers
echo 2. Clear browser cache completely
echo 3. Restart both servers using restart-servers.bat
echo 4. Test again
echo ========================================
pause