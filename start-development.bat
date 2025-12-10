@echo off
echo Starting Meal Pass Development Environment...
echo.

echo Starting Backend Server on port 5000...
start "Backend" cmd /k "cd backend && npm run dev"

timeout /t 5 /nobreak >nul

echo Starting Frontend Server on port 8080...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Development environment startup initiated.
echo Backend should be available at http://localhost:5000
echo Frontend should be available at http://localhost:8080
echo.
echo Press any key to close this window...
pause >nul