# Meal Pass - Cloud Deployment Guide

This guide provides instructions for deploying the Meal Pass application to a production environment on Ubuntu 22.04.

## Prerequisites

- Ubuntu 22.04 server with SSH access
- Domain name pointing to your server's IP address
- Root or sudo access

## 1. Server Setup

### Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Docker
```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install prerequisites
sudo apt update
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
```

### Install Node.js (for PM2 deployment alternative)
```bash
# Install NodeSource Node.js 18 repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs
```

### Install PM2 (for PM2 deployment alternative)
```bash
sudo npm install -g pm2
```

## 2. Application Deployment

### Clone the Repository
```bash
git clone <your-repo-url> meal-pass
cd meal-pass
```

### Configure Environment Variables

1. Update `.env.backend` with your production values:
   ```bash
   NODE_ENV=production
   PORT=5001
   MONGO_URI=mongodb://root:your-password@localhost:27017/mealpass?authSource=admin
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=30d
   ENABLE_AUTH=true
   CLIENT_URL=https://your-domain.com
   ```

2. Update `.env.frontend`:
   ```bash
   VITE_API_URL=https://your-domain.com/api
   ```

### Deploy with Docker (Recommended)

1. Build and start services:
   ```bash
   ./deploy.sh
   ```

2. Check service status:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

## 3. SSL Certificate Setup with Certbot

### Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

### Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Auto-renewal Setup
```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e

# Add this line to check for renewal twice daily:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 4. PM2 Deployment Alternative

If you prefer to run the application directly on the host system:

1. Install dependencies:
   ```bash
   cd backend && npm install --production
   cd ../frontend && npm install
   ```

2. Build frontend:
   ```bash
   npm run build
   ```

3. Start applications with PM2:
   ```bash
   pm2 start ecosystem.config.prod.js
   ```

4. Save PM2 configuration:
   ```bash
   pm2 save
   ```

5. Set PM2 to start on boot:
   ```bash
   pm2 startup
   ```

## 5. Nginx Configuration

The Nginx configuration is already included in the docker-compose setup. However, if you're running Nginx directly:

1. Copy the configuration:
   ```bash
   sudo cp nginx/meal-pass.conf /etc/nginx/sites-available/meal-pass
   sudo ln -s /etc/nginx/sites-available/meal-pass /etc/nginx/sites-enabled/
   ```

2. Test configuration:
   ```bash
   sudo nginx -t
   ```

3. Reload Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

## 6. Monitoring and Logs

### Docker Logs
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### PM2 Logs
```bash
# View all logs
pm2 logs

# View specific app logs
pm2 logs mealpass-api
```

### Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/mealpass.access.log

# Error logs
sudo tail -f /var/log/nginx/mealpass.error.log
```

## 7. Security Considerations

1. **Firewall Setup**:
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   ```

2. **MongoDB Security**:
   - Change default MongoDB credentials in `.env.backend`
   - Restrict MongoDB access to localhost only in production

3. **Application Security**:
   - Use strong JWT secrets
   - Enable authentication in production
   - Regularly update dependencies

## 8. Backup and Recovery

### Database Backup
```bash
# Create backup
docker exec mealpass_mongodb mongodump --username root --password your-password --out /backup

# Copy backup from container
docker cp mealpass_mongodb:/backup ./backup
```

### Application Backup
Regularly backup:
- Environment files
- SSL certificates
- Uploaded images (if stored locally)
- PM2 configuration

## 9. Troubleshooting

### Common Issues

1. **Port Conflicts**:
   ```bash
   sudo lsof -i :80
   sudo lsof -i :443
   sudo lsof -i :5001
   ```

2. **Docker Service Issues**:
   ```bash
   sudo systemctl status docker
   sudo systemctl restart docker
   ```

3. **Nginx Configuration Issues**:
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   sudo systemctl restart nginx
   ```

### Health Checks

1. **API Health Check**:
   ```bash
   curl -f https://your-domain.com/api/health
   ```

2. **Frontend Availability**:
   ```bash
   curl -f https://your-domain.com
   ```

## 10. Maintenance

### Updating the Application

1. Pull latest code:
   ```bash
   git pull origin main
   ```

2. Rebuild and restart services:
   ```bash
   ./deploy.sh
   ```

### Monitoring Scripts

Create a monitoring script to check application health:
```bash
#!/bin/bash
# health-check.sh

# Check if services are running
if curl -f https://your-domain.com/api/health > /dev/null; then
    echo "API is healthy"
else
    echo "API is down"
    # Send alert or restart service
fi
```

Add to crontab for regular health checks:
```bash
*/5 * * * * /path/to/health-check.sh
```

This deployment guide provides a production-ready setup for the Meal Pass application with proper security, SSL, monitoring, and maintenance procedures.