module.exports = {
  apps: [
    {
      name: 'mealpass-backend',
      cwd: './backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './backend/logs/pm2-backend-error.log',
      out_file: './backend/logs/pm2-backend-out.log',
      log_file: './backend/logs/pm2-backend-combined.log',
      time: true,
      combine_logs: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M'
    },
    {
      name: 'mealpass-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run preview',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      error_file: './frontend/logs/pm2-frontend-error.log',
      out_file: './frontend/logs/pm2-frontend-out.log',
      log_file: './frontend/logs/pm2-frontend-combined.log',
      time: true,
      combine_logs: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M'
    }
  ]
};