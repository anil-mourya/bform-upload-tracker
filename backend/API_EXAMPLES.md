# B-Form Upload Tracker API - Usage Examples

This document provides practical examples of how to use the B-Form Upload Tracker API.

## Authentication

First, obtain a JWT token (you need to implement a login endpoint separately):

```bash
# Assuming you have a user with ID and email
# Save the token for use in subsequent requests
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Postman Collection Examples

### 1. Health Check
```
GET /health
```

Response:
```json
{
  "success": true,
  "message": "B-Form Tracker API is healthy",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### 2. API Status
```
GET /api/status
```

Response:
```json
{
  "success": true,
  "status": "running",
  "version": "1.0.0",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 3600.5
}
```

## Upload Management Examples

### 3. Create Upload with File

```bash
curl -X POST http://localhost:5000/api/bform/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/bform.pdf" \
  -F "employee_id=EMP001" \
  -F "employee_name=John Doe" \
  -F "period=january" \
  -F "year=2024" \
  -F "remarks=Q1 B-Form submission"
```

**Using JavaScript/Fetch:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('employee_id', 'EMP001');
formData.append('employee_name', 'John Doe');
formData.append('period', 'january');
formData.append('year', 2024);
formData.append('remarks', 'Q1 B-Form submission');

const response = await fetch('http://localhost:5000/api/bform/uploads', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

**Using Python/Requests:**
```python
import requests

with open('bform.pdf', 'rb') as f:
    files = {'file': f}
    data = {
        'employee_id': 'EMP001',
        'employee_name': 'John Doe',
        'period': 'january',
        'year': 2024,
        'remarks': 'Q1 B-Form submission'
    }
    headers = {'Authorization': f'Bearer {token}'}
    
    response = requests.post(
        'http://localhost:5000/api/bform/uploads',
        files=files,
        data=data,
        headers=headers
    )
    print(response.json())
```

### 4. List All Uploads

```bash
curl -X GET "http://localhost:5000/api/bform/uploads/list?page=1&limit=10&sort_order=desc" \
  -H "Authorization: Bearer $TOKEN"
```

**With Filters:**
```bash
curl -X GET "http://localhost:5000/api/bform/uploads/list?status=verified&year=2024&period=january&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**Using JavaScript:**
```javascript
const params = new URLSearchParams({
  page: 1,
  limit: 10,
  status: 'verified',
  year: 2024,
  sort_by: 'upload_date',
  sort_order: 'desc'
});

const response = await fetch(
  `http://localhost:5000/api/bform/uploads/list?${params}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
console.log(data);
```

### 5. Get Upload Statistics

```bash
curl -X GET "http://localhost:5000/api/bform/uploads/stats?year=2024" \
  -H "Authorization: Bearer $TOKEN"
```

**With Period Filter:**
```bash
curl -X GET "http://localhost:5000/api/bform/uploads/stats?year=2024&period=january" \
  -H "Authorization: Bearer $TOKEN"
```

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

### 6. Get Not Uploaded Items

```bash
curl -X GET "http://localhost:5000/api/bform/uploads/not-uploaded?year=2024&period=january" \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Get Single Upload Details

```bash
curl -X GET "http://localhost:5000/api/bform/uploads/{upload-id}" \
  -H "Authorization: Bearer $TOKEN"
```

Replace `{upload-id}` with actual upload ID.

### 8. Download Upload File

```bash
curl -X GET "http://localhost:5000/api/bform/uploads/{upload-id}/download" \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded_file.pdf
```

**Using JavaScript:**
```javascript
const downloadFile = async (uploadId) => {
  const response = await fetch(
    `http://localhost:5000/api/bform/uploads/${uploadId}/download`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bform.pdf';
  a.click();
};
```

### 9. Get Upload History

```bash
curl -X GET "http://localhost:5000/api/bform/uploads/{upload-id}/history" \
  -H "Authorization: Bearer $TOKEN"
```

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
      },
      {
        "id": "uuid",
        "action": "created",
        "old_status": null,
        "new_status": "uploaded",
        "changed_by_name": "John Doe",
        "change_date": "2024-01-15T10:30:00Z",
        "remarks": null
      }
    ]
  }
}
```

### 10. Update Upload Status

```bash
curl -X PATCH "http://localhost:5000/api/bform/uploads/{upload-id}/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "verified",
    "remarks": "Document verified successfully"
  }'
```

**Using JavaScript:**
```javascript
const updateStatus = async (uploadId, newStatus, remarks) => {
  const response = await fetch(
    `http://localhost:5000/api/bform/uploads/${uploadId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: newStatus,
        remarks: remarks
      })
    }
  );
  
  return response.json();
};
```

### 11. Batch Create Uploads (Admin/Manager)

```bash
curl -X POST "http://localhost:5000/api/bform/uploads/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "uploads": [
      {
        "employee_id": "EMP001",
        "employee_name": "John Doe",
        "period": "january",
        "year": 2024,
        "remarks": "Q1 submission"
      },
      {
        "employee_id": "EMP002",
        "employee_name": "Jane Smith",
        "period": "january",
        "year": 2024,
        "remarks": "Q1 submission"
      },
      {
        "employee_id": "EMP003",
        "employee_name": "Bob Johnson",
        "period": "january",
        "year": 2024
      }
    ]
  }'
```

### 12. Export Uploads as CSV (Admin/Manager)

```bash
curl -X GET "http://localhost:5000/api/bform/uploads/export?year=2024&status=verified" \
  -H "Authorization: Bearer $TOKEN" \
  -o uploads_export.csv
```

### 13. Check and Mark Expired Uploads (Admin/Manager)

```bash
curl -X GET "http://localhost:5000/api/bform/uploads/check-expired" \
  -H "Authorization: Bearer $TOKEN"
```

### 14. Get Uploads by Date Range

```bash
curl -X GET "http://localhost:5000/api/bform/uploads/date-range?start_date=2024-01-01T00:00:00Z&end_date=2024-01-31T23:59:59Z&status=verified" \
  -H "Authorization: Bearer $TOKEN"
```

### 15. Delete Upload (Admin)

```bash
curl -X DELETE "http://localhost:5000/api/bform/uploads/{upload-id}" \
  -H "Authorization: Bearer $TOKEN"
```

## Error Handling Examples

### Validation Error
```
POST /api/bform/uploads
```

Response (400):
```json
{
  "success": false,
  "message": "Validation error",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "employee_id",
      "message": "employee_id is required",
      "type": "any.required"
    },
    {
      "field": "period",
      "message": "period must be one of [january, february, ...]",
      "type": "any.only"
    }
  ]
}
```

### Duplicate Entry Error
```
POST /api/bform/uploads
```

Response (409):
```json
{
  "success": false,
  "message": "Upload record already exists for this employee in the specified period",
  "code": "DUPLICATE_ENTRY"
}
```

### Unauthorized Error
```
GET /api/bform/uploads/list
(without Authorization header)
```

Response (401):
```json
{
  "success": false,
  "message": "Authorization header missing",
  "code": "AUTH_MISSING"
}
```

### Insufficient Permissions Error
```
POST /api/bform/uploads/batch
(with user role, requires admin/manager)
```

Response (403):
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

## Advanced Usage

### Implementing Polling for Upload Status

```javascript
const pollUploadStatus = async (uploadId, maxAttempts = 30) => {
  let attempts = 0;
  
  const poll = async () => {
    const response = await fetch(
      `http://localhost:5000/api/bform/uploads/${uploadId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    
    if (data.data.status === 'verified') {
      return data.data;
    }
    
    if (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      return poll();
    }
    
    throw new Error('Upload verification timeout');
  };
  
  return poll();
};
```

### Batch Upload Multiple Files

```javascript
const batchUploadFiles = async (filesData) => {
  const uploadPromises = filesData.map(fileData => {
    const formData = new FormData();
    formData.append('file', fileData.file);
    formData.append('employee_id', fileData.employee_id);
    formData.append('employee_name', fileData.employee_name);
    formData.append('period', fileData.period);
    formData.append('year', fileData.year);
    
    return fetch('http://localhost:5000/api/bform/uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }).then(res => res.json());
  });
  
  return Promise.all(uploadPromises);
};
```

## Performance Tips

1. **Use pagination** for large lists:
   ```javascript
   // Bad: Fetching all records
   GET /api/bform/uploads/list
   
   // Good: Fetch with pagination
   GET /api/bform/uploads/list?page=1&limit=50
   ```

2. **Filter by status** to reduce data:
   ```javascript
   GET /api/bform/uploads/list?status=pending&limit=50
   ```

3. **Use date range** for historical data:
   ```javascript
   GET /api/bform/uploads/date-range?start_date=2024-01-01&end_date=2024-01-31
   ```

4. **Cache statistics** locally to avoid repeated calls:
   ```javascript
   const cachedStats = {};
   
   const getStats = async (year) => {
     if (cachedStats[year]) {
      return cachedStats[year];
     }
     
     const response = await fetch(
       `http://localhost:5000/api/bform/uploads/stats?year=${year}`,
       { headers: { 'Authorization': `Bearer ${token}` } }
     );
     
     const data = await response.json();
     cachedStats[year] = data.data;
     return data.data;
   };
   ```

## Rate Limiting (Recommended Implementation)

Consider implementing rate limiting in your frontend:

```javascript
const createRateLimiter = (limit = 10, windowMs = 60000) => {
  let calls = [];
  
  return (fn) => async (...args) => {
    const now = Date.now();
    calls = calls.filter(timestamp => now - timestamp < windowMs);
    
    if (calls.length >= limit) {
      throw new Error('Rate limit exceeded');
    }
    
    calls.push(now);
    return fn(...args);
  };
};

const limitedListUploads = createRateLimiter(5, 60000)(listUploads);
```
