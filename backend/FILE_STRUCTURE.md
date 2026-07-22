# B-Form Upload Tracker - Complete File Structure

## Project Overview

Complete Express.js backend API for B-Form Upload Tracker with 8 fully implemented endpoints, JWT authentication, file upload handling, and comprehensive database management.

---

## Directory Structure

```
bform-tracker-api/
├── config/                          # Configuration files
│   └── database.js                  # MySQL connection pool & initialization
│
├── src/                             # Source code
│   ├── app.js                       # Express application setup
│   ├── server.js                    # Server entry point & startup
│   │
│   ├── controllers/
│   │   └── bformController.js       # All endpoint handlers (15 functions)
│   │
│   ├── models/
│   │   └── BFormUpload.js           # Database queries & operations
│   │
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication & authorization
│   │   ├── errorHandler.js          # Error handling & custom error class
│   │   └── validation.js            # Request validation with Joi
│   │
│   ├── routes/
│   │   └── bformRoutes.js           # All API routes & middleware
│   │
│   └── __tests__/
│       └── bform.controller.test.js # Unit tests (Jest)
│
├── scripts/                         # Utility scripts
│   ├── init-dev.sh                  # Linux/Mac setup script
│   └── init-dev.bat                 # Windows setup script
│
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore rules
├── .dockerignore                    # Docker ignore rules
├── docker-compose.yml               # Docker Compose configuration
├── Dockerfile                       # Docker image definition
├── jest.config.js                   # Jest testing configuration
├── package.json                     # Dependencies & scripts
│
├── README.md                        # Main API documentation
├── SETUP_GUIDE.md                   # Complete setup instructions
├── API_EXAMPLES.md                  # Usage examples & curl commands
├── DEPLOYMENT.md                    # Deployment guide for various platforms
└── FILE_STRUCTURE.md                # This file
```

---

## File Descriptions

### Configuration Files

#### `config/database.js`
- **Purpose:** Database configuration and initialization
- **Key Functions:**
  - `createPool()` - Creates MySQL connection pool
  - `initializeDatabase()` - Creates all required tables
- **Tables Created:**
  - `users` - User accounts with roles
  - `b_form_uploads` - Main upload records
  - `upload_history` - Change tracking
  - `audit_log` - Action logging
- **Features:**
  - Connection pooling for performance
  - Automatic reconnection
  - Health checks
  - Error handling

### Application Core

#### `src/app.js`
- **Purpose:** Express application setup and configuration
- **Middleware:**
  - Helmet for security headers
  - CORS configuration
  - JSON/URL-encoded body parsing
  - Error handler
- **Endpoints:**
  - GET `/` - API info
  - GET `/health` - Health check
  - GET `/api/status` - API status
  - All `/api/bform` routes

#### `src/server.js`
- **Purpose:** Server startup and initialization
- **Responsibilities:**
  - Initialize database
  - Create uploads directory
  - Start HTTP server
  - Handle graceful shutdown
  - Manage process signals
- **Features:**
  - Startup logging
  - Error handling
  - Resource cleanup
  - Uptime tracking

### Controllers

#### `src/controllers/bformController.js` (15 Functions)

| Function | HTTP Method | Endpoint | Purpose |
|----------|-------------|----------|---------|
| `listUploads` | GET | `/uploads/list` | List with pagination & filtering |
| `getNotUploaded` | GET | `/uploads/not-uploaded` | Get pending uploads |
| `getStats` | GET | `/uploads/stats` | Get statistics |
| `createUpload` | POST | `/uploads` | Create single upload |
| `uploadWithFile` | POST | `/uploads` | Create upload with file |
| `downloadFile` | GET | `/uploads/:id/download` | Download file |
| `getHistory` | GET | `/uploads/:id/history` | Get change history |
| `batchCreateUploads` | POST | `/uploads/batch` | Batch create records |
| `updateStatus` | PATCH | `/uploads/:id/status` | Update status |
| `getUploadDetails` | GET | `/uploads/:id` | Get single upload |
| `checkExpiredUploads` | GET | `/uploads/check-expired` | Check expiry |
| `exportUploads` | GET | `/uploads/export` | Export as CSV |
| `deleteUpload` | DELETE | `/uploads/:id` | Delete record |
| `getUploadsByDateRange` | GET | `/uploads/date-range` | Date range search |

All functions:
- Use `asyncHandler` for error handling
- Validate input with Joi schemas
- Return consistent JSON responses
- Enforce authentication & authorization

### Models

#### `src/models/BFormUpload.js` (14 Methods)

Database operations:
- `create()` - Create new record
- `getById()` - Fetch single record
- `getList()` - Paginated list with filtering
- `getNotUploaded()` - Get pending items
- `getStats()` - Aggregate statistics
- `updateStatus()` - Update with history
- `batchCreate()` - Batch insert
- `addHistory()` - Record changes
- `getHistory()` - Fetch change log
- `checkDuplicate()` - Prevent duplicates
- `delete()` - Remove record
- `getExpiredUploads()` - Find expired
- `markAsExpired()` - Mark as expired
- `getByDateRange()` - Date filtering

Features:
- Connection pooling
- Parameterized queries (SQL injection prevention)
- Transaction support
- Automatic error handling
- History tracking

### Middleware

#### `src/middleware/auth.js` (4 Exports)

**Functions:**
- `authMiddleware` - Validates JWT tokens
- `optionalAuthMiddleware` - Optional authentication
- `requireRole()` - Role-based access control
- `generateToken()` - Create JWT tokens

**Features:**
- JWT verification
- Token expiry handling
- Invalid token detection
- Role validation (admin, manager, user)
- Consistent error responses

#### `src/middleware/errorHandler.js` (3 Exports)

**Exports:**
- `AppError` - Custom error class
- `errorHandler` - Global error handler
- `asyncHandler` - Promise error wrapper

**Handles:**
- Validation errors (Joi)
- File upload errors (Multer)
- Database errors (MySQL)
- Auth errors (JWT)
- Custom application errors

#### `src/middleware/validation.js` (3 Functions + Schemas)

**Functions:**
- `validateRequest()` - Validate request body
- `validateQuery()` - Validate query params
- `validateParams()` - Validate URL params

**Schemas Defined:**
- `createUpload` - New upload validation
- `batchUpload` - Batch upload validation
- `updateStatus` - Status update validation
- `listUploadsQuery` - List query validation
- `statsQuery` - Stats query validation
- `uploadId` - ID parameter validation

**Features:**
- Joi schema validation
- Consistent error messages
- Field-level error details
- Type coercion
- Whitelist unknown fields

### Routes

#### `src/routes/bformRoutes.js` (13 Routes)

**Route Definitions:**
```
GET    /uploads/list              - List with filters
GET    /uploads/not-uploaded       - Get pending
GET    /uploads/stats              - Statistics
GET    /uploads/export             - CSV export
GET    /uploads/check-expired      - Check expiry
GET    /uploads/date-range         - Date range search
POST   /uploads                    - Create with file
POST   /uploads/batch              - Batch create
GET    /uploads/:id                - Get details
GET    /uploads/:id/download       - Download file
GET    /uploads/:id/history        - Get history
PATCH  /uploads/:id/status         - Update status
DELETE /uploads/:id                - Delete (admin)
```

**Middleware Stack:**
- Authentication (most routes)
- Role-based access control
- Request validation
- File upload handling (with multer)

**File Upload Configuration:**
- Supported formats: PDF, DOC, DOCX
- Max size: 50MB
- Storage: Disk-based
- Unique filename generation

### Testing

#### `src/__tests__/bform.controller.test.js`

**Test Suite:** Controller unit tests

**Test Coverage:**
- `listUploads()` - List & filter
- `getStats()` - Statistics
- `createUpload()` - Create & duplicates
- `updateStatus()` - Status transitions
- `batchCreateUploads()` - Batch operations
- `getHistory()` - History retrieval
- `getNotUploaded()` - Pending items

**Mocking:**
- BFormUpload model
- Request/response objects
- Async operations

**Features:**
- Jest framework
- Mock objects
- Error scenarios
- Success paths

### Scripts

#### `scripts/init-dev.sh` (Linux/Mac)
Automated setup script that:
- Checks Node.js & npm
- Installs dependencies
- Creates .env file
- Creates uploads directory
- Provides next steps

#### `scripts/init-dev.bat` (Windows)
Windows version of setup script

### Configuration Files

#### `.env.example`
**Environment Variables:**
- Server config (PORT, NODE_ENV)
- Database (HOST, USER, PASSWORD, NAME)
- JWT (SECRET, EXPIRES_IN)
- File upload (MAX_SIZE, DIR, TYPES)
- CORS (ORIGIN)
- Logging (LOG_LEVEL)

#### `package.json`
**Dependencies (Production):**
- express - Web framework
- mysql2 - Database
- jsonwebtoken - JWT auth
- multer - File uploads
- joi - Validation
- cors - Cross-origin
- helmet - Security headers
- dotenv - Environment vars
- uuid - ID generation
- moment - Date handling
- bcryptjs - Password hashing

**Dev Dependencies:**
- nodemon - Dev server reload
- jest - Testing
- supertest - API testing

**Scripts:**
- `npm start` - Production
- `npm run dev` - Development
- `npm test` - Run tests
- `npm run test:watch` - Test watch mode

#### `docker-compose.yml`
**Services:**
- MySQL database service
- Node.js API service

**Features:**
- Automatic MySQL initialization
- Health checks
- Volume management
- Network isolation
- Environment configuration

#### `Dockerfile`
**Multi-stage setup:**
- Alpine Linux base
- Dependency installation
- Code copy
- Directory setup
- Health check
- Container startup

**Features:**
- Minimal image size
- Fast builds
- Security scanning
- Proper signal handling

#### `.dockerignore`
Excludes from Docker build:
- node_modules
- .env files
- .git directory
- Test files
- Documentation

#### `jest.config.js`
**Test Configuration:**
- Node.js test environment
- Test pattern matching
- Coverage reporting
- Timeout settings
- File exclusions

### Documentation

#### `README.md` (Comprehensive)
- Features overview
- Installation steps
- API endpoint documentation
- Request/response examples
- Error handling
- Database schema
- Security features
- Performance tips
- Monitoring

#### `SETUP_GUIDE.md` (Step-by-step)
- Quick start (5 minutes)
- Detailed setup (10 minutes)
- Prerequisites check
- Database setup (GUI & CLI)
- Environment configuration
- Running the application
- Testing procedures
- Troubleshooting guide
- Next steps

#### `API_EXAMPLES.md` (Usage Examples)
- Authentication setup
- Postman collection examples
- cURL commands
- JavaScript/Fetch examples
- Python/Requests examples
- Error handling examples
- Advanced usage patterns
- Performance tips

#### `DEPLOYMENT.md` (Deployment Guide)
- Local development
- Docker deployment
- Production deployment (Linux)
- AWS (EC2 + RDS, Elastic Beanstalk)
- DigitalOcean (App Platform, Droplet)
- Heroku deployment
- Monitoring & maintenance
- Scaling considerations
- Security checklist
- Troubleshooting

#### `FILE_STRUCTURE.md` (This File)
Complete documentation of all files and their purposes.

---

## Data Flow

### Upload Creation Flow
```
POST /api/bform/uploads (with file)
  ↓
Route Middleware (auth, validation, file upload)
  ↓
uploadWithFile() Controller
  ↓
Check Duplicate → BFormUpload.checkDuplicate()
  ↓
Create Record → BFormUpload.create()
  ↓
Add History → BFormUpload.addHistory()
  ↓
Return Success Response
```

### List Uploads Flow
```
GET /api/bform/uploads/list?filters
  ↓
Route Middleware (auth, query validation)
  ↓
listUploads() Controller
  ↓
BFormUpload.getList(filters)
  ↓
Build WHERE clause with filters
  ↓
Execute pagination query
  ↓
Count total records
  ↓
Return Paginated Response
```

### Status Update Flow
```
PATCH /api/bform/uploads/:id/status
  ↓
Route Middleware (auth, validation)
  ↓
updateStatus() Controller
  ↓
Get Current → BFormUpload.getById()
  ↓
Validate Transition (status state machine)
  ↓
Update Status → BFormUpload.updateStatus()
  ↓
Add History → BFormUpload.addHistory()
  ↓
Return Updated Record
```

---

## Database Schema

### users Table
```sql
id (UUID) - Primary Key
email (VARCHAR) - Unique
password_hash (VARCHAR)
full_name (VARCHAR)
role (ENUM: admin, manager, user)
created_at, updated_at (TIMESTAMP)
```

### b_form_uploads Table
```sql
id (UUID) - Primary Key
employee_id (VARCHAR) - Indexed
employee_name (VARCHAR)
period (VARCHAR) - Indexed
year (INT) - Indexed
file_path (VARCHAR)
file_name (VARCHAR)
file_size (BIGINT)
status (ENUM) - Indexed
upload_date (TIMESTAMP)
verification_date (TIMESTAMP)
expiry_date (DATE) - Indexed
uploaded_by_id (UUID) - FK
verified_by_id (UUID) - FK
remarks (TEXT)
created_at, updated_at (TIMESTAMP)
```

### upload_history Table
```sql
id (UUID) - Primary Key
upload_id (UUID) - FK, Indexed
action (VARCHAR)
old_status (VARCHAR)
new_status (VARCHAR)
changed_by_id (UUID) - FK
remarks (TEXT)
change_date (TIMESTAMP) - Indexed
```

### audit_log Table
```sql
id (UUID) - Primary Key
user_id (UUID) - FK, Indexed
action (VARCHAR) - Indexed
entity_type (VARCHAR)
entity_id (VARCHAR)
details (JSON)
ip_address (VARCHAR)
user_agent (VARCHAR)
created_at (TIMESTAMP) - Indexed
```

---

## Key Features by File

### Security
- **auth.js** - JWT token validation
- **errorHandler.js** - Secure error messages
- **database.js** - Parameterized queries
- **validation.js** - Input sanitization
- **app.js** - Helmet security headers

### Reliability
- **errorHandler.js** - Comprehensive error handling
- **bformController.js** - Try-catch with asyncHandler
- **database.js** - Connection pooling & reconnection
- **BFormUpload.js** - Transaction support

### Scalability
- **database.js** - Connection pooling
- **bformRoutes.js** - Pagination support
- **Dockerfile** - Containerization
- **docker-compose.yml** - Multi-service setup

### Maintainability
- **Clear separation of concerns** - Routes, Controllers, Models
- **Consistent error handling** - AppError class
- **Schema validation** - Joi schemas
- **Comprehensive documentation** - Multiple guide files
- **Unit tests** - Jest test suite

---

## Getting Started

1. **Setup Environment**
   ```bash
   npm install
   npm run init-dev  # Uses scripts/init-dev.sh or .bat
   ```

2. **Configure Database**
   - Edit `.env` with database credentials
   - Create MySQL database
   - Tables auto-created on first run

3. **Start Server**
   ```bash
   npm run dev
   ```

4. **Test API**
   ```bash
   curl http://localhost:5000/health
   ```

5. **Read Documentation**
   - Start with `README.md` for API overview
   - Use `SETUP_GUIDE.md` for detailed setup
   - Reference `API_EXAMPLES.md` for usage
   - See `DEPLOYMENT.md` for production

---

## Total Files Summary

- **Configuration Files:** 5 (.env.example, docker-compose.yml, Dockerfile, .dockerignore, jest.config.js)
- **Source Code:** 7 (app.js, server.js, bformController.js, BFormUpload.js, 3 middleware files, bformRoutes.js)
- **Tests:** 1 (bform.controller.test.js)
- **Scripts:** 2 (init-dev.sh, init-dev.bat)
- **Documentation:** 5 (README.md, SETUP_GUIDE.md, API_EXAMPLES.md, DEPLOYMENT.md, FILE_STRUCTURE.md)
- **Other:** 3 (package.json, .gitignore, config/database.js)

**Total: 23 files covering all aspects of a production-ready backend API**

---

## Production Deployment Checklist

- [ ] All environment variables configured
- [ ] Database backup enabled
- [ ] SSL certificates installed
- [ ] CORS properly configured
- [ ] Strong JWT secret set
- [ ] Error logging configured
- [ ] Rate limiting implemented
- [ ] Request/response compression enabled
- [ ] Security headers validated
- [ ] Database indexes verified
- [ ] Monitoring alerts setup
- [ ] Graceful shutdown tested
- [ ] Automated backups configured
- [ ] Security audit passed
- [ ] Load testing completed
