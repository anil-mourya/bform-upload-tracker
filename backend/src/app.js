const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const bformRoutes = require('./routes/bformRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const { AppError } = require('./middleware/errorHandler');

const app = express();

// Trust proxy for production
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'B-Form Tracker API is healthy',
    timestamp: new Date().toISOString()
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Main API routes
app.use('/api/bform', bformRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'B-Form Upload Tracker API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      status: '/api/status',
      uploads: '/api/bform/uploads'
    }
  });
});

// 404 Not Found handler
app.use((req, res, next) => {
  throw new AppError('Route not found', 404, 'NOT_FOUND');
});

// Global error handler - must be last
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;
