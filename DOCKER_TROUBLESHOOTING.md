# Docker Build Troubleshooting Guide

This guide addresses common issues encountered when building the Meal Pass Docker image.

## Dependency Conflict Error

### Problem
```
npm error While resolving: multer-gridfs-storage@5.0.2
npm error Found: multer@1.4.5-lts.2
npm error node_modules/multer
npm error   multer@"^1.4.5-lts.1" from the root project
npm error
npm error Could not resolve dependency:
npm error peer multer@"^1.4.2" from multer-gridfs-storage@5.0.2
```

### Solution
The Dockerfile has been updated to use the `--legacy-peer-deps` flag:
```dockerfile
RUN npm ci --only=production --legacy-peer-deps
```

This flag tells npm to ignore peer dependency conflicts and proceed with the installation.

## Alternative Solutions

### 1. Force Installation (Not Recommended)
```dockerfile
RUN npm ci --only=production --force
```

### 2. Update Dependencies
If you prefer to resolve the conflict by updating dependencies, you can try:
```json
{
  "dependencies": {
    "multer": "^1.4.4",
    "multer-gridfs-storage": "^5.0.2"
  }
}
```

However, this may require code changes if there are breaking changes between versions.

## Testing the Fix

### Local Testing
To test the Docker build locally:
```bash
cd backend
docker build -t meal-pass-backend .
```

### Verification Script
Run the GridFS verification script to ensure the setup works:
```bash
npm run verify-gridfs
```

## Common Docker Build Issues

### 1. Slow Builds
- Use `.dockerignore` to exclude unnecessary files
- Leverage Docker layer caching by ordering instructions properly

### 2. Missing Dependencies
- Ensure all required dependencies are listed in `package.json`
- Check that native dependencies (like Puppeteer) have proper system packages installed

### 3. Permission Issues
- Ensure the Docker container has appropriate permissions for file operations
- Check that directories are created with proper permissions

## Best Practices

1. **Use Specific Versions**: Pin dependency versions to avoid unexpected breaking changes
2. **Multi-stage Builds**: Consider using multi-stage builds for production images
3. **Health Checks**: Implement proper health checks for container orchestration
4. **Security**: Regularly update base images and dependencies
5. **Logging**: Ensure logs are properly configured for debugging

## Render Deployment

When deploying to Render:
1. Ensure the `Dockerfile` is in the root of the backend directory
2. Set the build command to `docker build -t meal-pass-backend .`
3. Set the start command to `npm start`
4. Configure environment variables in the Render dashboard

## Additional Resources

- [npm legacy-peer-deps documentation](https://docs.npmjs.com/cli/v8/using-npm/config#legacy-peer-deps)
- [Docker best practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Render Docker deployment guide](https://render.com/docs/deploy-with-docker)