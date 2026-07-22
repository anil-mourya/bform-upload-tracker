# B-Form Upload Tracker - API Documentation

This document describes the API endpoints required for the B-Form Upload Tracker frontend.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All requests must include a JWT token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

## Endpoints

### 1. Get Upload Tracker Data

Fetches uploaded and pending B-Forms with optional filtering.

**Endpoint:** `GET /b-forms/tracker`

**Query Parameters:**
- `period` (optional): `jan-jun`, `jul-dec`, or `custom`
- `year` (optional): Year as integer (e.g., 2024)
- `startDate` (optional): Start date in YYYY-MM-DD format (for custom period)
- `endDate` (optional): End date in YYYY-MM-DD format (for custom period)

**Example Request:**
```bash
GET /api/b-forms/tracker?period=jan-jun&year=2024
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "uploaded": [
      {
        "id": "bform-001",
        "bFormNumber": "BF-2024-001",
        "companyName": "ABC Company",
        "companyId": "comp-123",
        "uploadedBy": "John Doe",
        "uploadDate": "2024-01-15T10:30:00Z",
        "status": "uploaded",
        "fileSize": 2048000,
        "fileName": "B-Form-2024-001.pdf",
        "notes": "Initial upload"
      }
    ],
    "notUploaded": [
      {
        "id": "bform-002",
        "bFormNumber": "BF-2024-002",
        "companyName": "XYZ Corporation",
        "companyId": "comp-456",
        "assignedTo": "Jane Smith",
        "dueDate": "2024-02-20T23:59:59Z",
        "priority": "High",
        "status": "pending",
        "notes": "Awaiting documents"
      }
    ]
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid date range provided"
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid or expired authentication token"
}
```

---

### 2. Get Statistics

Fetches summary statistics for B-Forms.

**Endpoint:** `GET /b-forms/stats`

**Query Parameters:**
- `period` (optional): `jan-jun`, `jul-dec`, or `custom`
- `year` (optional): Year as integer
- `startDate` (optional): Start date in YYYY-MM-DD format
- `endDate` (optional): End date in YYYY-MM-DD format

**Example Request:**
```bash
GET /api/b-forms/stats?period=jul-dec&year=2024
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "uploaded": 120,
    "pending": 25,
    "overdue": 5,
    "uploadPercentage": 80,
    "pendingPercentage": 16.67,
    "overduePercentage": 3.33
  }
}
```

---

### 3. Upload B-Form

Upload a B-Form file with metadata.

**Endpoint:** `POST /b-forms/upload`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer <JWT_TOKEN>
```

**Form Data:**
- `file` (file, required): PDF file to upload
- `bFormNumber` (string, required): B-Form number (e.g., BF-2024-001)
- `companyId` (string, required): Company ID
- `notes` (string, optional): Upload notes

**Example Request:**
```bash
POST /api/b-forms/upload
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

file: <binary_pdf_data>
bFormNumber: BF-2024-001
companyId: comp-123
notes: Initial upload
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "bform-upload-001",
    "bFormNumber": "BF-2024-001",
    "uploadDate": "2024-01-20T15:30:00Z",
    "fileSize": 2048000,
    "status": "uploaded",
    "message": "B-Form uploaded successfully"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "File size exceeds maximum limit of 50MB"
}
```

---

### 4. Assign B-Form

Assign a pending B-Form to a user.

**Endpoint:** `POST /b-forms/{bFormId}/assign`

**URL Parameters:**
- `bFormId` (string, required): B-Form ID

**Request Body:**
```json
{
  "assignedTo": "user-id-or-email"
}
```

**Example Request:**
```bash
POST /api/b-forms/bform-002/assign
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "assignedTo": "jane.smith@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "bform-002",
    "bFormNumber": "BF-2024-002",
    "assignedTo": "Jane Smith",
    "assignedDate": "2024-01-20T16:00:00Z",
    "status": "assigned"
  }
}
```

---

### 5. Get B-Form Details

Fetch detailed information about a specific B-Form.

**Endpoint:** `GET /b-forms/{bFormId}`

**URL Parameters:**
- `bFormId` (string, required): B-Form ID

**Example Request:**
```bash
GET /api/b-forms/bform-001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "bform-001",
    "bFormNumber": "BF-2024-001",
    "companyName": "ABC Company",
    "companyId": "comp-123",
    "status": "uploaded",
    "uploadedBy": "John Doe",
    "uploadDate": "2024-01-15T10:30:00Z",
    "fileName": "B-Form-2024-001.pdf",
    "fileSize": 2048000,
    "filePath": "/uploads/b-forms/BF-2024-001.pdf",
    "notes": "Initial upload",
    "history": [
      {
        "action": "uploaded",
        "by": "John Doe",
        "at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "B-Form not found"
}
```

---

### 6. Update B-Form Status

Update the status of a B-Form.

**Endpoint:** `PUT /b-forms/{bFormId}/status`

**URL Parameters:**
- `bFormId` (string, required): B-Form ID

**Request Body:**
```json
{
  "status": "verified|rejected|archived"
}
```

**Example Request:**
```bash
PUT /api/b-forms/bform-001/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "verified"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "bform-001",
    "bFormNumber": "BF-2024-001",
    "status": "verified",
    "updatedAt": "2024-01-20T17:00:00Z"
  }
}
```

---

### 7. Search B-Forms

Search B-Forms by various criteria.

**Endpoint:** `GET /b-forms/search`

**Query Parameters:**
- `q` (string, required): Search query
- `type` (optional): `number`, `company`, `user`, or `all`
- `status` (optional): `uploaded`, `pending`, `overdue`
- `period` (optional): `jan-jun`, `jul-dec`, or `custom`
- `year` (optional): Year as integer

**Example Request:**
```bash
GET /api/b-forms/search?q=ABC%20Company&status=pending&year=2024
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "bform-002",
        "bFormNumber": "BF-2024-002",
        "companyName": "ABC Company Ltd.",
        "status": "pending",
        "assignedTo": "Jane Smith",
        "dueDate": "2024-02-20T23:59:59Z"
      }
    ],
    "totalResults": 1
  }
}
```

---

### 8. Export B-Forms Data

Export B-Forms data in various formats.

**Endpoint:** `GET /b-forms/export`

**Query Parameters:**
- `format` (string, required): `csv`, `excel`, or `pdf`
- `period` (optional): `jan-jun`, `jul-dec`, or `custom`
- `year` (optional): Year as integer
- `startDate` (optional): Start date in YYYY-MM-DD format
- `endDate` (optional): End date in YYYY-MM-DD format
- `type` (optional): `uploaded`, `pending`, or `all`

**Example Request:**
```bash
GET /api/b-forms/export?format=csv&period=jan-jun&year=2024
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="b-forms-export-2024.csv"

"B-Form Number","Company Name","Status","Upload Date","Uploaded By"
"BF-2024-001","ABC Company","Uploaded","2024-01-15","John Doe"
"BF-2024-002","XYZ Corporation","Pending","","Jane Smith"
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Unsupported export format. Use csv, excel, or pdf"
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid or expired authentication token",
  "code": "AUTH_001"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "You do not have permission to access this resource",
  "code": "AUTH_002"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found",
  "code": "NOT_FOUND_001"
}
```

### 422 Unprocessable Entity
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_001",
  "details": {
    "field_name": "error message"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "An unexpected error occurred",
  "code": "SERVER_001"
}
```

---

## Data Models

### B-Form (Uploaded)
```typescript
{
  id: string;
  bFormNumber: string;
  companyName: string;
  companyId: string;
  uploadedBy: string;
  uploadDate: string (ISO 8601);
  status: "uploaded" | "verified" | "archived";
  fileSize: number;
  fileName: string;
  notes?: string;
}
```

### B-Form (Not Uploaded)
```typescript
{
  id: string;
  bFormNumber: string;
  companyName: string;
  companyId: string;
  assignedTo: string;
  dueDate: string (ISO 8601);
  priority: "High" | "Medium" | "Low";
  status: "pending" | "overdue" | "assigned";
  notes?: string;
}
```

### Statistics
```typescript
{
  total: number;
  uploaded: number;
  pending: number;
  overdue: number;
  uploadPercentage: number;
  pendingPercentage: number;
  overduePercentage: number;
}
```

---

## Rate Limiting

API requests are rate-limited to 100 requests per minute per user.

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Implementation Notes

1. **Date Formats**: All dates should be in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
2. **File Uploads**: Maximum file size is 50MB, only PDF files are accepted
3. **Authentication**: Use JWT tokens with an expiration time
4. **Pagination**: Implement offset-based pagination for list endpoints
5. **Caching**: Consider implementing cache headers for GET requests
6. **CORS**: Enable CORS for the frontend domain
7. **Validation**: Implement server-side validation for all inputs
8. **Logging**: Log all API requests for debugging and auditing

---

## Integration Checklist

- [ ] Implement authentication endpoint
- [ ] Implement GET /b-forms/tracker
- [ ] Implement GET /b-forms/stats
- [ ] Implement POST /b-forms/upload
- [ ] Implement POST /b-forms/{id}/assign
- [ ] Implement GET /b-forms/{id}
- [ ] Implement PUT /b-forms/{id}/status
- [ ] Implement GET /b-forms/search
- [ ] Implement GET /b-forms/export
- [ ] Set up error handling and logging
- [ ] Configure CORS and security headers
- [ ] Set up rate limiting
- [ ] Test with frontend application
