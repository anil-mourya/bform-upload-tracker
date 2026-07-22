# B-Form Upload Tracker API

A production-ready Express.js backend API for managing B-Form uploads with authentication, validation, and comprehensive tracking features.

## Features

- JWT-based authentication and authorization
- Complete file upload/download handling
- Role-based access control (Admin, Manager, User)
- Request validation with Joi
- Comprehensive error handling
- Database connection pooling with MySQL2
- CORS configuration
- Audit logging
- Upload history tracking
- Batch operations support
- Statistics and reporting
- Expiry date management
- CSV export functionality

## Project Structure

```
bform-tracker-api/
├── src/
│   ├── app.js                          # Express application setup
│   ├── server.js                       # Server entry point
│   ├── controllers/
│   │   └── bformController.js          # Request handlers
│   ├── models/
│   │   └── BFormUpload.js              # Database model
│   ├── middleware/
│   │   ├── auth.js                     # JWT authentication
│   │   ├── errorHandler.js             # Error handling
│   │   └── validation.js               # Request validation
│   └── routes/
│       └── bformRoutes.js              # API routes
├── config/
│   └── database.js                     # Database configuration
├── .env.example                        # Environment variables template
├── package.json                        # Dependencies
└── README.md                           # This file
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd bform-tracker-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bform_tracker

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads

# CORS
CORS_ORIGIN=http://localhost:3000
```

4. **Create MySQL database**
```bash
mysql -u root -p
CREATE DATABASE bform_tracker;
```

5. **Start the server**
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
All endpoints (except health check) require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Base URL
```
http://localhost:5000/api/bform
```

### Endpoints

#### 1. GET `/uploads/list`
Get paginated list of uploads with filtering

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `status` (string): 'pending', 'uploaded', 'verified', 'rejected', 'expired'
- `period` (string): 'january', 'february', ..., 'december'
- `year` (number): 2000-2100
- `employee_id` (string): Search by employee ID
- `employee_name` (string): Search by employee name
- `sort_by` (string): 'created_at', 'upload_date', 'employee_name', 'status'
- `sort_order` (string): 'asc', 'desc'

**Response:**
```json
{
  "success": true,
  "message": "Uploads retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "employee_id": "EMP001",
      "employee_name": "John Doe",
      "period": "january",
      "year": 2024,
      "status": "verified",
      "file_name": "bform.pdf",
      "file_size": 1024000,
      "upload_date": "2024-01-15T10:30:00Z",
      "verification_date": "2024-01-16T14:20:00Z",
      "expiry_date": "2025-01-15",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

#### 2. GET `/uploads/not-uploaded`
Get uploads with pending status

**Query Parameters:**
- `period` (string, optional)
- `year` (number, optional)

**Response:**
```json
{
  "success": true,
  "message": "Not uploaded items retrieved successfully",
  "data": [...],
  "count": 25
}
```

#### 3. GET `/uploads/stats`
Get statistics about uploads

**Query Parameters:**
- `year` (number, optional)
- `period` (string, optional)

**Response:**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "total_uploads": 500,
    "uploaded": 450,
    "verified": 400,
    "pending": 50,
    "rejected": 0,
    "expired": 0,
    "total_file_size": 5242880000,
    "unique_employees": 250,
    "upload_rate": "85.00",
    "pending_rate": "10.00"
  }
}
```

#### 4. POST `/uploads`
Create a new upload record with file

**Request:**
- Content-Type: multipart/form-data
- Fields:
  - `file` (file, required): PDF or DOC/DOCX file
  - `employee_id` (string, required)
  - `employee_name` (string, required)
  - `period` (string, required)
  - `year` (number, required)
  - `remarks` (string, optional)

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/bform/uploads \
  -H "Authorization: Bearer <token>" \
  -F "file=@bform.pdf" \
  -F "employee_id=EMP001" \
  -F "employee_name=John Doe" \
  -F "period=january" \
  -F "year=2024"
```

**Response:** (201 Created)
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "uuid",
    "employee_id": "EMP001",
    "employee_name": "John Doe",
    "period": "january",
    "year": 2024,
    "file_name": "bform.pdf",
    "file_path": "./uploads/file-1234567890.pdf",
    "file_size": 1024000
  }
}
```

#### 5. GET `/uploads/:id/download`
Download upload file

**Response:** File download

#### 6. GET `/uploads/:id/history`
Get upload history and changes

**Response:**
```json
{
  "success": true,
  "message": "Upload history retrieved successfully",
  "data": {
    "upload": {
      "id": "uuid",
      "employee_id": "EMP001",
      "employee_name": "John Doe",
      "period": "january",
      "year": 2024,
      "status": "verified"
    },
    "history": [
      {
        "id": "uuid",
        "action": "status_updated",
        "old_status": "uploaded",
        "new_status": "verified",
        "changed_by_name": "Manager Name",
        "change_date": "2024-01-16T14:20:00Z",
        "remarks": "Document verified successfully"
      }
    ]
  }
}
```

#### 7. POST `/uploads/batch`
Batch create upload records (admin/manager only)

**Request:**
```json
{
  "uploads": [
    {
      "employee_id": "EMP001",
      "employee_name": "John Doe",
      "period": "january",
      "year": 2024,
      "remarks": "Optional remarks"
    },
    {
      "employee_id": "EMP002",
      "employee_name": "Jane Smith",
      "period": "january",
      "year": 2024
    }
  ]
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "message": "Batch uploads created successfully",
  "data": [...],
  "count": 2
}
```

#### 8. PATCH `/uploads/:id/status`
Update upload status

**Request:**
```json
{
  "status": "verified",
  "remarks": "Document verified successfully"
}
```

**Valid Status Transitions:**
- pending → uploaded, verified, rejected
- uploaded → verified, rejected, pending
- verified → rejected
- rejected → pending, uploaded
- expired → pending, uploaded

**Response:**
```json
{
  "success": true,
  "message": "Upload status updated successfully",
  "data": {
    "id": "uuid",
    "status": "verified"
  }
}
```

### Additional Endpoints

#### GET `/uploads/:id`
Get single upload details

#### GET `/uploads/export`
Export uploads as CSV (admin/manager only)

#### GET `/uploads/check-expired`
Check and mark expired uploads (admin/manager only)

#### GET `/uploads/date-range`
Get uploads by date range

**Query Parameters:**
- `start_date` (string, ISO format, required)
- `end_date` (string, ISO format, required)
- `status` (string, optional)
- `employee_id` (string, optional)

#### DELETE `/uploads/:id`
Delete upload record (admin only)

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": []
}
```

### Common Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (Duplicate)
- `500` - Internal Server Error

## Database Schema

### Tables

**users**
- id (UUID)
- email
- password_hash
- full_name
- role (admin, manager, user)
- timestamps

**b_form_uploads**
- id (UUID)
- employee_id
- employee_name
- period
- year
- file_path
- file_name
- file_size
- status
- upload_date
- verification_date
- expiry_date
- timestamps

**upload_history**
- id (UUID)
- upload_id (FK)
- action
- old_status
- new_status
- changed_by_id (FK)
- remarks
- change_date

**audit_log**
- id (UUID)
- user_id (FK)
- action
- entity_type
- entity_id
- details (JSON)
- ip_address
- user_agent
- timestamps

## Testing

Run tests:
```bash
npm test

# With watch mode
npm run test:watch
```

## Development

### Running with nodemon
```bash
npm run dev
```

### View logs
Logs are displayed in the console with timestamps and request details.

## Deployment

### Environment-specific configuration

**Production:**
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<very-secure-random-key>
DB_HOST=<production-db-host>
CORS_ORIGIN=https://yourdomain.com
```

### Docker deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t bform-tracker-api .
docker run -p 5000:5000 --env-file .env bform-tracker-api
```

## Performance Optimization

- Database connection pooling with configurable pool size
- Query optimization with proper indexing
- File streaming for downloads
- CORS configuration
- Helmet for security headers
- Request size limits

## Security

- JWT token-based authentication
- Password hashing with bcryptjs
- Input validation with Joi
- CORS configuration
- Helmet security headers
- SQL injection prevention with parameterized queries
- Role-based access control
- Audit logging

## Monitoring

The API provides monitoring endpoints:

```
GET /health              - Health check
GET /api/status          - API status and uptime
```

## Support and Documentation

For API documentation, visit: `/` (root endpoint)

## License

ISC
