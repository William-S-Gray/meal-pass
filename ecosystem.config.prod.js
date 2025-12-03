module.exports = {
  apps: [
    {
      name: 'mealpass-api',
      cwd: './backend',
      script: 'server.js',
      instances: 0, // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      error_file: './backend/logs/pm2-api-error.log',
      out_file: './backend/logs/pm2-api-out.log',
      log_file: './backend/logs/pm2-api-combined.log',
      time: true,
      combine_logs: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=4096'
    }
  ]
};