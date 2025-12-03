const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const http = require('http');
require('colors');

// Load env vars
dotenv.config();

// Database connection
const connectDB = require('./config/db');

// Route files
const beneficiaryRoutes = require('./routes/beneficiaryRoutes');
const feedRoutes = require('./routes/feedRoutes');
const authRoutes = require('./routes/authRoutes');
const feedingRoutes = require('./routes/feedingRoutes');
const reportsRoutes = require('./routes/reportsRoutes');

// Middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'],
    credentials: true,
    optionsSuccessStatus: 200
  }
});

// Store Socket.IO instance in app for use in controllers
app.set('io', io);

// Connect to database
connectDB();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS with specific options for better security
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Set security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Static folder with CORS headers for QR codes
app.use('/qrcodes', cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'],
  credentials: true
}), express.static(__dirname + '/public/qrcodes'));

// Static folder for other assets
app.use(express.static(__dirname + '/public'));

// Mount routers
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/feeding', feedingRoutes);
app.use('/api/reports', reportsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
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

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
});

module.exports = app;