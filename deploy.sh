#!/bin/bash

# Meal Pass Deployment Script

set -e  # Exit on any error

echo "Starting Meal Pass deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Build the services
echo "Building Docker images..."
docker-compose -f docker-compose.prod.yml build

# Start the services
echo "Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Check if services are running
echo "Checking service status..."
docker-compose -f docker-compose.prod.yml ps

echo "Deployment completed!"
echo "Access the application at https://your-domain.com"
echo "Remember to:"
echo "1. Update the domain name in nginx/meal-pass.conf"
echo "2. Install SSL certificates"
echo "3. Update the .env files with your secrets"