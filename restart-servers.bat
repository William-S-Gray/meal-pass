@echo off
echo ========================================
echo MEAL PASS - SERVER RESTART SCRIPT
echo ========================================
echo.

echo 1. Stopping any existing processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo 2. Starting Backend Server on port 5000...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo.
echo 3. Waiting for backend to start...
timeout /t 8 /nobreak >nul

echo.
echo 4. Starting Frontend Server on port 8080...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo SERVERS STARTED SUCCESSFULLY
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:8080
echo.
echo Please wait for both servers to fully initialize.
echo Then open http://localhost:8080 in your browser.
echo.
echo IMPORTANT: Clear your browser cache before testing!
echo ========================================
echo.
pause