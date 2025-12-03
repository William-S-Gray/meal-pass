@echo off
REM Meal Pass Deployment Script for Windows

echo Starting Meal Pass deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

echo Building Docker images...
docker-compose -f docker-compose.prod.yml build

echo Starting services...
docker-compose -f docker-compose.prod.yml up -d

echo Waiting for services to start...
timeout /t 10 /nobreak >nul

echo Checking service status...
docker-compose -f docker-compose.prod.yml ps

echo Deployment completed!
echo Access the application at https://your-domain.com
echo Remember to:
echo 1. Update the domain name in nginx/meal-pass.conf
echo 2. Install SSL certificates
echo 3. Update the .env files with your secrets