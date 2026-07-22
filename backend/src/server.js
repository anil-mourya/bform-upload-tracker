require('dotenv').config();
const app = require('./app');
const { initializeDatabase, pool } = require('../config/database');
const fs = require('fs').promises;

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;

const startServer = async () => {
  try {
    // Create uploads directory if it doesn't exist
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      console.log(`Uploads directory ready: ${uploadDir}`);
    } catch (error) {
      console.error('Error creating uploads directory:', error);
    }

    // Initialize database tables
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully');

    // Start server
    server = app.listen(PORT, () => {
      console.log(`
===========================================
B-Form Upload Tracker API
===========================================
Server running on port: ${PORT}
Environment: ${NODE_ENV}
Date: ${new Date().toISOString()}
===========================================
      `);

      console.log('Available endpoints:');
      console.log('  GET  /health                              - Health check');
      console.log('  GET  /api/status                          - API status');
      console.log('  GET  /api/bform/uploads/list              - List uploads with filtering');
      console.log('  GET  /api/bform/uploads/not-uploaded      - Get pending uploads');
      console.log('  GET  /api/bform/uploads/stats             - Get statistics');
      console.log('  GET  /api/bform/uploads/export            - Export as CSV');
      console.log('  GET  /api/bform/uploads/check-expired     - Check expired uploads');
      console.log('  GET  /api/bform/uploads/:id               - Get upload details');
      console.log('  GET  /api/bform/uploads/:id/download      - Download file');
      console.log('  GET  /api/bform/uploads/:id/history       - Get upload history');
      console.log('  POST /api/bform/uploads                   - Create upload with file');
      console.log('  POST /api/bform/uploads/batch             - Batch create uploads');
      console.log('  PATCH /api/bform/uploads/:id/status       - Update status');
      console.log('  DELETE /api/bform/uploads/:id             - Delete upload');
      console.log('==========================================');
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async () => {
  console.log('\nShutting down gracefully...');

  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
    });
  }

  try {
    await pool.end();
    console.log('Database connection pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }

  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Start the server
startServer();

module.exports = server;
