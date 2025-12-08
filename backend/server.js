const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const http = require('http');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('colors');

// Load env vars
dotenv.config();

// Database connection
const connectDB = require('./config/db');

// GridFS utilities
const { initGridFS } = require('./utils/gridfs');

// Route files
const authRoutes = require('./routes/authRoutes');
const feedingRoutes = require('./routes/feedingRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

// Middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL?.replace("https://", "http://")
    ],
    credentials: true,
    optionsSuccessStatus: 200
  }
});

// Store Socket.IO instance in app for use in controllers
app.set('io', io);

// Connect to database
connectDB().then(async () => {
  try {
    // Initialize GridFS after database connection
    await initGridFS();
    console.log('GridFS initialized successfully'.green);
  } catch (error) {
    console.error('Failed to initialize GridFS:', error.message.red);
  }
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS with specific options for better security
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL?.replace("https://", "http://")
  ],
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override, Accept, Origin, X-Requested-With",
  exposedHeaders: ["Content-Disposition"],
  credentials: true
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: { policy: "require-corp" },
  crossOriginOpenerPolicy: { policy: "same-origin" }
}));

// Compression middleware
app.use(compression());

// Logging middleware for development only
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter); // Apply rate limiting to all API routes

// Static folder with CORS headers for QR codes
app.use('/qrcodes', cors({
  origin: [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL?.replace("https://", "http://")
  ],
  methods: "GET,HEAD,OPTIONS",
  allowedHeaders: "Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override, Accept, Origin, X-Requested-With",
  credentials: true
}), express.static(__dirname + '/public/qrcodes'));

// Static folder for other assets
app.use(express.static(__dirname + '/public'));

// Handle CORS preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/feeding', feedingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/employees', employeeRoutes);

// Health check endpoint for Render
app.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Get uptime
    const uptime = process.uptime();
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: uptime,
      environment: process.env.ACTIVE_ENV || 'unknown',
      database: {
        status: dbStatus,
        readyState: dbState
      },
      system: {
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB'
        },
        pid: process.pid
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Meal Pass API is running',
    version: '1.0.0'
  });
});

// Error handler middleware
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`.red);
  process.exit(1);
});

// Use Render's dynamic port or default to 5000
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
});

module.exports = app;