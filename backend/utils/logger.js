const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
const fs = require('fs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Determine log level based on environment
const logLevel = process.env.NODE_ENV === 'production' ? 'warn' : (process.env.LOG_LEVEL || 'info');

// Create the logger
const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'meal-pass-backend' },
  transports: [
    // Write all logs with level `error` and below to `error.log`
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    
    // In production, only log warnings and errors to reduce I/O
    // In development, log everything
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info'
    }),
  ],
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;