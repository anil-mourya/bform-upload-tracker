# B-Form Upload Tracker - Complete Setup Guide

A step-by-step guide to get the B-Form Upload Tracker API running locally and in production.

## Table of Contents

1. [Quick Start (5 minutes)](#quick-start)
2. [Detailed Setup (10 minutes)](#detailed-setup)
3. [Database Configuration](#database-configuration)
4. [Running the Application](#running-the-application)
5. [Testing the API](#testing-the-api)
6. [Troubleshooting](#troubleshooting)

## Quick Start

### For the Impatient (5 minutes)

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd bform-tracker-api
   npm install
   ```

2. **Setup database**
   ```bash
   mysql -u root -p
   > CREATE DATABASE bform_tracker;
   > EXIT;
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start server**
   ```bash
   npm run dev
   ```

5. **Test it**
   ```bash
   curl http://localhost:5000/health
   ```

That's it! The API is now running at `http://localhost:5000`

## Detailed Setup

### Prerequisites Check

Before starting, ensure you have:

```bash
# Check Node.js
node --version      # Should be v14 or higher
npm --version       # Should be v6 or higher

# Check MySQL
mysql --version     # Should be v5.7 or higher
```

If any are missing, install them:

**Windows:**
- Node.js: https://nodejs.org/
- MySQL: https://dev.mysql.com/downloads/mysql/

**macOS:**
```bash
brew install node mysql
```

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install nodejs npm mysql-server
```

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd bform-tracker-api
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`

### Step 3: Database Configuration

#### Option A: Using GUI (PhpMyAdmin or Workbench)

1. Open MySQL Workbench or phpMyAdmin
2. Create new database: `bform_tracker`
3. Create new user: `bform_user` with password `bform_password`
4. Grant privileges:
   ```sql
   GRANT ALL PRIVILEGES ON bform_tracker.* TO 'bform_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

#### Option B: Using Command Line

```bash
# Login to MySQL
mysql -u root -p

# Run these commands
CREATE DATABASE bform_tracker;
CREATE USER 'bform_user'@'localhost' IDENTIFIED BY 'bform_password';
GRANT ALL PRIVILEGES ON bform_tracker.* TO 'bform_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 4: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file with your settings:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=bform_user
DB_PASSWORD=bform_password
DB_NAME=bform_tracker
DB_POOL_SIZE=10

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=.pdf,.doc,.docx

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

### Step 5: Verify Database Connection

Test your database configuration:

```bash
# Run this quick test
node -e "
const mysql = require('mysql2/promise');
mysql.createPool({
  host: 'localhost',
  user: 'bform_user',
  password: 'bform_password',
  database: 'bform_tracker'
}).getConnection().then(conn => {
  console.log('Database connection successful!');
  conn.release();
  process.exit(0);
}).catch(err => {
  console.error('Database connection failed:', err.message);
  process.exit(1);
});
"
```

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts the server with auto-reload using nodemon.

**Expected output:**
```
===========================================
B-Form Upload Tracker API
===========================================
Server running on port: 5000
Environment: development
Date: 2024-01-20T10:30:00.000Z
===========================================
```

### Production Mode

```bash
npm start
```

## Testing the API

### 1. Health Check

```bash
curl http://localhost:5000/health
```

Expected response (200):
```json
{
  "success": true,
  "message": "B-Form Tracker API is healthy",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### 2. API Status

```bash
curl http://localhost:5000/api/status
```

### 3. Test with Authorization

First, you need to create a JWT token. Since the API doesn't include an auth endpoint, you'll need to create a user in the database:

```bash
# Generate token (using Node.js)
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  {
    id: 'test-user',
    email: 'test@example.com',
    role: 'manager',
    full_name: 'Test User'
  },
  'your-jwt-secret-from-env-file',
  { expiresIn: '7d' }
);
console.log('Token:', token);
"
```

Save the token and use it:

```bash
# Replace with your actual token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get uploads
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/bform/uploads/list

# Get statistics
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/bform/uploads/stats
```

### 4. Test File Upload

```bash
# Create a test PDF (or use existing one)
echo "Sample PDF content" > test.pdf

# Upload file
TOKEN="your-token-here"

curl -X POST http://localhost:5000/api/bform/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf" \
  -F "employee_id=EMP001" \
  -F "employee_name=John Doe" \
  -F "period=january" \
  -F "year=2024"
```

### 5. Using Postman

Import these requests into Postman:

**Collection URL Structure:**
```
http://localhost:5000
```

**Endpoints to test:**
- `GET /health` (no auth required)
- `GET /api/status` (no auth required)
- `GET /api/bform/uploads/list` (requires JWT)
- `GET /api/bform/uploads/stats` (requires JWT)
- `POST /api/bform/uploads` (requires JWT, multipart/form-data)
- `POST /api/bform/uploads/batch` (requires JWT, JSON)
- `PATCH /api/bform/uploads/:id/status` (requires JWT)

## Project Structure Explanation

```
bform-tracker-api/
├── config/
│   └── database.js              # Database connection & initialization
│
├── src/
│   ├── app.js                   # Express app setup
│   ├── server.js                # Server startup
│   ├── controllers/
│   │   └── bformController.js   # Request handlers
│   ├── models/
│   │   └── BFormUpload.js       # Database queries
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── errorHandler.js      # Error handling
│   │   └── validation.js        # Request validation
│   └── routes/
│       └── bformRoutes.js       # API routes
│
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies
├── README.md                    # Documentation
└── Dockerfile                   # Docker configuration
```

### Key Files Explained

**config/database.js**
- Creates MySQL connection pool
- Initializes database tables on startup
- Handles database errors

**src/app.js**
- Sets up Express application
- Configures middleware (CORS, security, etc.)
- Defines global error handler

**src/routes/bformRoutes.js**
- Defines all API endpoints
- Sets up file upload handling
- Applies middleware to routes

**src/middleware/auth.js**
- Validates JWT tokens
- Extracts user information
- Handles role-based access control

**src/middleware/validation.js**
- Validates request body/query/params
- Uses Joi for schema validation
- Returns validation errors

## Common Issues and Solutions

### Issue: "Cannot connect to database"

**Solution:**
```bash
# 1. Check if MySQL is running
sudo systemctl status mysql

# 2. Start MySQL if not running
sudo systemctl start mysql

# 3. Verify credentials
mysql -u bform_user -p
# Enter password and run: SELECT 1;

# 4. Check .env file has correct settings
cat .env | grep DB_
```

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Find process using port
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=5001 npm run dev
```

### Issue: "Module not found"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: "CORS error in browser"

**Solution:**
```env
# Update .env with your frontend URL
CORS_ORIGIN=http://localhost:3000
```

### Issue: "Invalid token"

**Solution:**
```bash
# Regenerate token with correct secret
# Make sure JWT_SECRET in .env is consistent
# Create new token with same secret
```

## Next Steps

1. **Customize Configuration:**
   - Update file upload limits in `.env`
   - Configure CORS for your frontend URL
   - Set strong JWT secret in production

2. **Implement Authentication:**
   - Create login endpoint for generating tokens
   - Add user registration endpoint
   - Implement refresh token mechanism

3. **Add Frontend:**
   - Create React/Vue application
   - Connect to API endpoints
   - Implement file upload UI

4. **Deploy:**
   - Choose deployment platform (AWS, DigitalOcean, etc.)
   - Follow `DEPLOYMENT.md` guide
   - Set up monitoring and logging

5. **Production Hardening:**
   - Implement rate limiting
   - Add request logging
   - Enable request/response compression
   - Set up automated backups
   - Configure CDN for file downloads

## Getting Help

### Documentation Files

- `README.md` - API documentation
- `API_EXAMPLES.md` - Usage examples
- `DEPLOYMENT.md` - Deployment guide
- `SETUP_GUIDE.md` - This file

### Debug Mode

Enable verbose logging:

```bash
# Add to .env
LOG_LEVEL=debug
NODE_ENV=development

# Run with additional debugging
DEBUG=* npm run dev
```

### Check Logs

```bash
# View application logs
npm run dev 2>&1 | tee app.log

# View system logs (Linux)
journalctl -u bform-api -f
```

### Common Commands Reference

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run specific test
npm test -- bform.controller.test.js

# Watch mode for tests
npm run test:watch

# Install new package
npm install package-name

# Remove package
npm uninstall package-name

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Performance Tips

1. **Use pagination** when fetching large datasets
2. **Filter by status** to reduce query results
3. **Limit file size** to prevent large uploads
4. **Use connection pooling** (configured by default)
5. **Enable gzip compression** in production

## Security Tips

1. **Change JWT_SECRET** in production
2. **Use HTTPS** in production
3. **Enable CORS** only for your domain
4. **Validate file types** on upload
5. **Sanitize user input** (done by Joi)
6. **Use strong database password**
7. **Enable SSL for MySQL** connection
8. **Regular security updates** (`npm audit fix`)

## Summary

You now have a fully functional B-Form Upload Tracker API! The database tables are automatically created on first run, so you can start using the API immediately.

For more details:
- API endpoints: See `README.md`
- Usage examples: See `API_EXAMPLES.md`
- Deployment: See `DEPLOYMENT.md`

Happy coding!
