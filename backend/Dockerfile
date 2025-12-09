# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to resolve multer conflict
RUN npm ci --only=production --legacy-peer-deps

# Install curl for health checks
RUN apk add --no-cache curl

# Set environment variables
ENV NODE_ENV=production

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Create public directories
RUN mkdir -p public/qrcodes public/photos

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/health || exit 1

# Start the application
CMD ["npm", "start"]