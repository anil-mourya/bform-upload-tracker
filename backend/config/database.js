const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bform_tracker',
  waitForConnections: true,
  connectionLimit: process.env.DB_POOL_SIZE || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
  enableStreamingResults: false,
  supportBigNumbers: true,
  bigNumberStrings: true
});

pool.on('connection', (connection) => {
  console.log('New database connection established');
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  }
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
    console.error('Database had a fatal error.');
  }
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_CLOSE') {
    console.error('Database connection was forcibly closed.');
  }
});

// Initialize database tables
const initializeDatabase = async () => {
  const connection = await pool.getConnection();
  try {
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role ENUM('admin', 'manager', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      )
    `);

    // Create b_form_uploads table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS b_form_uploads (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        employee_id VARCHAR(255) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        period VARCHAR(50) NOT NULL,
        year INT NOT NULL,
        file_path VARCHAR(500),
        file_name VARCHAR(255),
        file_size BIGINT,
        status ENUM('pending', 'uploaded', 'verified', 'rejected', 'expired') DEFAULT 'pending',
        uploaded_by_id VARCHAR(36),
        upload_date TIMESTAMP,
        verified_by_id VARCHAR(36),
        verification_date TIMESTAMP,
        expiry_date DATE,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by_id) REFERENCES users(id),
        FOREIGN KEY (verified_by_id) REFERENCES users(id),
        INDEX idx_employee_id (employee_id),
        INDEX idx_period_year (period, year),
        INDEX idx_status (status),
        INDEX idx_expiry_date (expiry_date),
        UNIQUE KEY unique_employee_period_year (employee_id, period, year)
      )
    `);

    // Create upload_history table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS upload_history (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        upload_id VARCHAR(36) NOT NULL,
        action VARCHAR(50) NOT NULL,
        old_status VARCHAR(50),
        new_status VARCHAR(50),
        changed_by_id VARCHAR(36),
        change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        remarks TEXT,
        FOREIGN KEY (upload_id) REFERENCES b_form_uploads(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by_id) REFERENCES users(id),
        INDEX idx_upload_id (upload_id),
        INDEX idx_change_date (change_date)
      )
    `);

    // Create audit_log table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36),
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100),
        entity_id VARCHAR(36),
        details JSON,
        ip_address VARCHAR(45),
        user_agent VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at)
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  initializeDatabase
};
