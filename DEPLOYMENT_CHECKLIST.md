# Meal-Pass Deployment Checklist

## Pre-Deployment Requirements

### 1. Infrastructure Setup
- [ ] MongoDB Atlas cluster created
- [ ] MongoDB connection string obtained
- [ ] Render account created
- [ ] GitHub repository connected to Render

### 2. Security Preparation
- [ ] Generate secure JWT secret
- [ ] Configure MongoDB Atlas IP whitelist
- [ ] Set up database user with appropriate permissions

## Backend Deployment (Render Web Service)

### Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `MONGODB_URI` (MongoDB Atlas connection string)
- [ ] `JWT_SECRET` (secure secret key)
- [ ] `JWT_EXPIRE=30d`
- [ ] `ENABLE_AUTH=true`
- [ ] `FRONTEND_URL` (Render frontend URL)
- [ ] `BASE_URL` (Render backend URL)

### Configuration
- [ ] Update CORS whitelist with Render frontend URL
- [ ] Verify health check endpoint works (`/health`)
- [ ] Test database connection

## Frontend Deployment (Render Static Site)

### Environment Variables
- [ ] `VITE_API_URL` (Render backend URL)

### Build Configuration
- [ ] Build command: `npm install && npm run build`
- [ ] Publish directory: `dist`

## Post-Deployment Verification

### API Endpoints
- [ ] `GET /api/beneficiaries` (returns list of beneficiaries)
- [ ] `POST /api/auth/login` (authentication works)
- [ ] `GET /health` (health check endpoint)

### Frontend Functionality
- [ ] Login page loads correctly
- [ ] Beneficiary list displays
- [ ] QR code generation works
- [ ] Feeding status updates function
- [ ] Reports page loads

### Security Checks
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting working
- [ ] No sensitive information in client-side code

## Monitoring and Maintenance

### Health Monitoring
- [ ] Set up Render alerts for downtime
- [ ] Configure MongoDB Atlas monitoring
- [ ] Set up logging aggregation

### Backup Strategy
- [ ] Regular MongoDB backups
- [ ] Version control for configuration files
- [ ] Document recovery procedures

## Troubleshooting Common Issues

### CORS Errors
- Verify `FRONTEND_URL` environment variable
- Check CORS whitelist in `server.js`
- Ensure frontend URL matches exactly

### Database Connection Issues
- Verify `MONGODB_URI` format and credentials
- Check MongoDB Atlas IP whitelist
- Confirm database user permissions

### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Ensure build scripts are correct

### Performance Optimization
- Enable gzip compression (already configured)
- Consider CDN for static assets
- Monitor response times
- Optimize database indexes

## Scaling Considerations

### When to Upgrade
- Database performance degradation
- High response times under load
- Memory/CPU usage consistently high

### Render Plan Upgrades
- Free → Starter for production use
- Consider autoscaling options
- Review bandwidth limitations

## Maintenance Tasks

### Regular Updates
- [ ] Update dependencies regularly
- [ ] Apply security patches
- [ ] Review logs for errors
- [ ] Monitor resource usage

### Data Management
- [ ] Archive old feeding records
- [ ] Monitor database size
- [ ] Clean up unused QR codes