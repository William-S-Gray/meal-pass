# Deployment Instructions - Meal-Pass System

## Prerequisites

1. Docker and Docker Compose installed
2. Node.js (v18 or higher) and npm
3. Git

## Local Development Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd meal-pass
```

### 2. Environment Configuration
Ensure the following environment files are properly configured:

**backend/.env**
```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://admin:password@mongodb:27017/mealpass?authSource=admin
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d
ENABLE_AUTH=false
FRONTEND_URL=http://localhost:8080
BASE_URL=http://localhost:5001
```

**.env.mongodb**
```env
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password
MONGO_INITDB_DATABASE=mealpass
```

### 3. Start the Application
```bash
docker-compose up -d
```

### 4. Verify the Application
Check that all services are running:
```bash
docker ps
```

Verify the backend health:
```bash
curl http://localhost:5001/health
```

## Production Deployment (Render)

### 1. Environment Variables
Set the following environment variables in your Render dashboard:

```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://<username>:<password>@<mongodb-host>:<port>/<database>?authSource=admin
JWT_SECRET=your_production_jwt_secret
JWT_EXPIRE=30d
ENABLE_AUTH=true
CLIENT_URL=https://your-frontend-domain.com
```

### 2. Deploy Using Render Blueprint
Use the `render.yaml` file for automatic deployment configuration.

### 3. Manual Deployment Steps
1. Build the Docker images:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. Push images to container registry
3. Deploy containers to production environment

## Database Configuration

### MongoDB Connection
- **Development**: mongodb://admin:password@mongodb:27017/mealpass?authSource=admin
- **Production**: Update with your production MongoDB connection string

### GridFS
The system uses GridFS for storing QR codes. Ensure MongoDB has sufficient storage space for file storage.

## Security Considerations

### CORS Configuration
The application uses strict CORS policies:
- Allows localhost:8080 for development
- Allows your production frontend domain
- Blocks all other origins

### Authentication
JWT tokens are used for authentication with a 30-day expiration period.

## Troubleshooting

### Port Conflicts
If you encounter port conflicts:
1. Stop conflicting services:
   ```bash
   docker-compose down
   ```
2. Change ports in docker-compose.yml if needed
3. Restart services:
   ```bash
   docker-compose up -d
   ```

### MongoDB Connection Issues
1. Verify MongoDB is running:
   ```bash
   docker logs mealpass-mongodb
   ```

2. Check connection string in environment variables
3. Ensure MongoDB credentials are correct

### Backend Startup Issues
1. Check backend logs:
   ```bash
   docker logs mealpass-backend
   ```

2. Verify all environment variables are set correctly
3. Ensure MongoDB is accessible

## Maintenance

### Database Backup
Regular backups of the MongoDB database are recommended:
```bash
docker exec mealpass-mongodb mongodump --db mealpass --out /backup/
```

### Log Monitoring
Monitor application logs for errors:
```bash
docker logs -f mealpass-backend
```

### Updates
To update the application:
1. Pull the latest code:
   ```bash
   git pull origin main
   ```

2. Rebuild and restart services:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

## Scaling Considerations

### Horizontal Scaling
For high-traffic environments:
1. Use a managed MongoDB service (MongoDB Atlas)
2. Scale backend instances behind a load balancer
3. Use a CDN for static assets

### Performance Optimization
1. Monitor database query performance
2. Implement database indexing for frequently queried fields
3. Use caching mechanisms for frequently accessed data

## Support

For deployment issues, contact the development team or check the documentation in:
- DEPLOYMENT_GUIDE.md
- DOCKER_TROUBLESHOOTING.md
- README.md