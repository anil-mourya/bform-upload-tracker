# B-Form Upload Tracker - Database Schema & API Design

## 1. Database Schema

### 1.1 Primary Table: `bform_uploads`

This table tracks all merged B-Form uploads for internal record-keeping.

```sql
CREATE TABLE bform_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to existing systems
    customer_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    fe_refill_id UUID REFERENCES fe_refills(id) ON DELETE SET NULL,
    
    -- Society/B-Form Details
    society_name VARCHAR(255) NOT NULL,
    bform_number VARCHAR(20) NOT NULL,
    
    -- File Information
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_kb INT,
    file_mime_type VARCHAR(50) DEFAULT 'application/pdf',
    
    -- Upload Tracking
    upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    uploaded_by_user_id UUID REFERENCES users(id),
    
    -- Period Tracking (for filtering)
    period VARCHAR(20) NOT NULL, -- 'Jan-Jun', 'Jul-Dec', 'Custom'
    year INT NOT NULL,
    period_start_date DATE,
    period_end_date DATE,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'Uploaded', 
    -- Options: 'Uploaded', 'Processing', 'Verified', 'Failed', 'Pending'
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete support
    
    -- Additional Metadata
    notes TEXT,
    is_merged_with_license BOOLEAN DEFAULT true,
    bmc_submitted BOOLEAN DEFAULT false,
    bmc_submission_date TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(customer_id, year, period),
    CONSTRAINT valid_period CHECK (period IN ('Jan-Jun', 'Jul-Dec', 'Custom')),
    CONSTRAINT valid_year CHECK (year >= 2020 AND year <= 2099)
);
```

### 1.2 Supporting Table: `bform_upload_history`

Tracks changes and historical records for audit purposes.

```sql
CREATE TABLE bform_upload_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    bform_upload_id UUID NOT NULL REFERENCES bform_uploads(id) ON DELETE CASCADE,
    
    -- Action tracking
    action VARCHAR(50) NOT NULL, -- 'Created', 'Updated', 'Downloaded', 'Verified'
    action_by_user_id UUID REFERENCES users(id),
    
    -- Old and new values
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changes JSONB, -- Stores field changes as JSON
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);
```

### 1.3 Summary Table: `bform_upload_summary`

Cached summary statistics for quick dashboard queries (materialized view or triggered update).

```sql
CREATE TABLE bform_upload_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    year INT NOT NULL,
    period VARCHAR(20) NOT NULL,
    
    total_customers INT DEFAULT 0,
    uploaded_count INT DEFAULT 0,
    not_uploaded_count INT DEFAULT 0,
    pending_count INT DEFAULT 0,
    
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(year, period)
);
```

### 1.4 Indexes

```sql
-- Performance indexes
CREATE INDEX idx_bform_uploads_customer_id ON bform_uploads(customer_id);
CREATE INDEX idx_bform_uploads_year_period ON bform_uploads(year, period);
CREATE INDEX idx_bform_uploads_status ON bform_uploads(status);
CREATE INDEX idx_bform_uploads_upload_date ON bform_uploads(upload_date DESC);
CREATE INDEX idx_bform_uploads_bform_number ON bform_uploads(bform_number);
CREATE INDEX idx_bform_uploads_society_name ON bform_uploads(society_name);

-- Full-text search index
CREATE INDEX idx_bform_uploads_society_search ON bform_uploads USING GIN (to_tsvector('english', society_name));

-- Composite index for common queries
CREATE INDEX idx_bform_uploads_year_period_status ON bform_uploads(year, period, status);
```

---

## 2. API Endpoint Specifications

### 2.1 List Uploaded B-Forms

**Endpoint:** `GET /api/bform/uploads/list`

**Query Parameters:**
```
- year: INT (required) - E.g., 2026
- period: STRING (required) - 'Jan-Jun', 'Jul-Dec', 'Custom'
- period_start_date: DATE (conditional) - Required if period='Custom'
- period_end_date: DATE (conditional) - Required if period='Custom'
- page: INT (optional, default=1)
- per_page: INT (optional, default=20, max=100)
- sort_by: STRING (optional, default='upload_date') - 'society_name', 'bform_number', 'upload_date'
- sort_order: STRING (optional, default='DESC') - 'ASC' or 'DESC'
- search: STRING (optional) - Search by society name or B-Form number
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "uuid-123",
        "customer_id": "uuid-customer",
        "society_name": "SPRING FIELD CHSL",
        "bform_number": "168BF",
        "upload_date": "2026-07-22T10:30:00Z",
        "file_name": "168BF_SPRING FIELD CHSL_MERGED.pdf",
        "file_size_kb": 1920,
        "status": "Uploaded",
        "uploaded_by": "Anil Mourya",
        "is_merged_with_license": true,
        "bmc_submitted": false
      },
      {
        "id": "uuid-124",
        "customer_id": "uuid-customer2",
        "society_name": "SOHAM RESIDENCY",
        "bform_number": "169BF",
        "upload_date": "2026-07-22T10:32:00Z",
        "file_name": "169BF_SOHAM RESIDENCY_MERGED.pdf",
        "file_size_kb": 2100,
        "status": "Uploaded",
        "uploaded_by": "Anil Mourya",
        "is_merged_with_license": true,
        "bmc_submitted": false
      }
      // ... more records
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_records": 56,
      "total_pages": 3
    },
    "summary": {
      "period": "Jan-Jun 2026",
      "total_uploaded": 56,
      "total_not_uploaded": 0
    }
  }
}
```

---

### 2.2 List B-Forms Not Uploaded

**Endpoint:** `GET /api/bform/uploads/not-uploaded`

**Query Parameters:**
```
- year: INT (required)
- period: STRING (required)
- page: INT (optional, default=1)
- per_page: INT (optional, default=20)
- sort_by: STRING (optional)
- sort_order: STRING (optional)
- search: STRING (optional)
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "uuid-pending-1",
        "customer_id": "uuid-customer3",
        "society_name": "PENDING SOCIETY A",
        "last_bform_date": "2025-12-15T00:00:00Z",
        "expected_date": "2026-06-30T00:00:00Z",
        "days_overdue": 22,
        "status": "Pending",
        "contact_name": "Mr. Sharma",
        "contact_phone": "+91-9876543210",
        "contact_email": "sharma@society.com"
      }
      // ... more pending records
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_records": 0,
      "total_pages": 0
    },
    "summary": {
      "period": "Jan-Jun 2026",
      "total_not_uploaded": 0
    }
  }
}
```

---

### 2.3 Get Upload Statistics

**Endpoint:** `GET /api/bform/uploads/stats`

**Query Parameters:**
```
- year: INT (required)
- period: STRING (required)
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "Jan-Jun 2026",
    "year": 2026,
    "statistics": {
      "total_customers": 56,
      "uploaded_count": 56,
      "not_uploaded_count": 0,
      "pending_count": 0,
      "verified_count": 0,
      "failed_count": 0,
      "upload_percentage": 100.0
    },
    "breakdown_by_status": {
      "Uploaded": 56,
      "Processing": 0,
      "Verified": 0,
      "Failed": 0,
      "Pending": 0
    },
    "recent_uploads": {
      "last_7_days": 56,
      "last_30_days": 56,
      "date_range": "2026-07-22 to 2026-07-22"
    }
  }
}
```

---

### 2.4 Create/Upload B-Form Record

**Endpoint:** `POST /api/bform/uploads`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Form Data:**
```
- customer_id: UUID (required)
- bform_number: STRING (required) - E.g., '168BF'
- year: INT (required)
- period: STRING (required)
- file: FILE (required) - PDF file
- notes: STRING (optional)
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-new-upload",
    "customer_id": "uuid-customer",
    "society_name": "SPRING FIELD CHSL",
    "bform_number": "168BF",
    "upload_date": "2026-07-22T14:45:30Z",
    "file_name": "168BF_SPRING FIELD CHSL_MERGED.pdf",
    "status": "Uploaded",
    "message": "B-Form uploaded successfully"
  }
}
```

---

### 2.5 Download B-Form

**Endpoint:** `GET /api/bform/uploads/:id/download`

**Response:**
- Returns PDF file with proper headers
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="..."

---

### 2.6 Get Upload History

**Endpoint:** `GET /api/bform/uploads/:id/history`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "upload_id": "uuid-123",
    "history": [
      {
        "id": "history-1",
        "action": "Created",
        "action_by": "Anil Mourya",
        "timestamp": "2026-07-22T10:30:00Z",
        "old_status": null,
        "new_status": "Uploaded",
        "notes": "B-Form uploaded via Upload Tracker"
      },
      {
        "id": "history-2",
        "action": "Downloaded",
        "action_by": "Admin User",
        "timestamp": "2026-07-22T11:45:00Z",
        "old_status": "Uploaded",
        "new_status": "Uploaded",
        "notes": "Downloaded for verification"
      }
    ]
  }
}
```

---

### 2.7 Batch Upload B-Forms

**Endpoint:** `POST /api/bform/uploads/batch`

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
```
- files: FILE[] (required) - Multiple PDF files
- metadata: JSON (required) - Array of {customer_id, bform_number, year, period}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "total_files": 56,
    "successful": 56,
    "failed": 0,
    "results": [
      {
        "file": "168BF_SPRING FIELD.pdf",
        "status": "success",
        "id": "uuid-123"
      }
      // ... more results
    ]
  }
}
```

---

### 2.8 Update Upload Status

**Endpoint:** `PATCH /api/bform/uploads/:id/status`

**Request Body:**
```json
{
  "status": "Verified",
  "notes": "B-Form verified against BMC records"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "status": "Verified",
    "updated_at": "2026-07-22T15:30:00Z"
  }
}
```

---

## 3. Integration with Existing Systems

### 3.1 Link to Customers Table

```sql
-- Ensure foreign key relationship
ALTER TABLE bform_uploads 
ADD CONSTRAINT fk_customer 
FOREIGN KEY (customer_id) 
REFERENCES accounts(id) ON DELETE CASCADE;
```

### 3.2 Link to F/E Refill Records

```sql
-- Optional link to existing fe_refills table
ALTER TABLE bform_uploads 
ADD CONSTRAINT fk_fe_refill 
FOREIGN KEY (fe_refill_id) 
REFERENCES fe_refills(id) ON DELETE SET NULL;
```

### 3.3 Update Customer Record with B-Form Status

When a B-Form is uploaded, update the customer account:

```sql
UPDATE accounts 
SET 
  bform_upload_date = NOW(),
  bform_status = 'Uploaded',
  updated_at = NOW()
WHERE id = $1;
```

---

## 4. Data Migration & Population

### 4.1 Populate Initial 56 Records

For our 56 merged B-Forms, create records:

```sql
INSERT INTO bform_uploads 
(customer_id, society_name, bform_number, file_name, file_path, upload_date, period, year, status, is_merged_with_license)
VALUES
('customer-uuid-1', 'SPRING FIELD CHSL', '168BF', '168BF_SPRING FIELD CHSL_MERGED.pdf', '/uploads/bforms/168BF_SPRING FIELD CHSL_MERGED.pdf', '2026-07-22 10:30:00', 'Jan-Jun', 2026, 'Uploaded', true),
('customer-uuid-2', 'SOHAM RESIDENCY', '169BF', '169BF_SOHAM RESIDENCY_MERGED.pdf', '/uploads/bforms/169BF_SOHAM RESIDENCY_MERGED.pdf', '2026-07-22 10:32:00', 'Jan-Jun', 2026, 'Uploaded', true),
-- ... (repeat for all 56)
;
```

### 4.2 Mapping of Our 56 Societies

```json
{
  "batch_1_original_33": [
    {"bform": "168BF", "society": "SPRING FIELD CHSL"},
    {"bform": "169BF", "society": "SOHAM RESIDENCY"},
    // ... (all 33)
  ],
  "batch_2_new_7": [
    {"bform": "232BF", "society": "SHREE PURI TOWER"},
    {"bform": "233BF", "society": "SHRADHA TOWER"},
    // ... (all 7)
  ],
  "batch_3_latest_16": [
    {"bform": "250BF", "society": "NIRMAN CHSL"},
    {"bform": "251BF", "society": "NEW LATA APARTMENT"},
    // ... (all 16)
  ]
}
```

---

## 5. Triggers & Automation

### 5.1 Auto-update Summary Statistics

```sql
CREATE OR REPLACE FUNCTION update_bform_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO bform_upload_summary (year, period, uploaded_count, not_uploaded_count, last_updated)
  SELECT 
    NEW.year,
    NEW.period,
    COUNT(*) FILTER (WHERE status = 'Uploaded'),
    COUNT(*) FILTER (WHERE status NOT IN ('Uploaded', 'Verified')),
    NOW()
  FROM bform_uploads
  WHERE year = NEW.year AND period = NEW.period
  ON CONFLICT (year, period) DO UPDATE SET
    uploaded_count = EXCLUDED.uploaded_count,
    not_uploaded_count = EXCLUDED.not_uploaded_count,
    last_updated = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bform_uploads_summary_trigger
AFTER INSERT OR UPDATE OR DELETE ON bform_uploads
FOR EACH ROW EXECUTE FUNCTION update_bform_summary();
```

### 5.2 Create History Record

```sql
CREATE OR REPLACE FUNCTION create_upload_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO bform_upload_history 
  (bform_upload_id, action, action_by_user_id, old_status, new_status, changes)
  VALUES
  (NEW.id, 'Created', current_user_id(), NULL, NEW.status, 
   jsonb_build_object('file_name', NEW.file_name, 'society', NEW.society_name));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bform_uploads_history_trigger
AFTER INSERT ON bform_uploads
FOR EACH ROW EXECUTE FUNCTION create_upload_history();
```

---

## 6. Security & Permissions

### 6.1 Role-Based Access Control

```sql
-- Create roles
CREATE ROLE bform_uploader;
CREATE ROLE bform_viewer;
CREATE ROLE bform_admin;

-- Grant permissions
GRANT SELECT ON bform_uploads TO bform_viewer;
GRANT SELECT, INSERT, UPDATE ON bform_uploads TO bform_uploader;
GRANT SELECT, INSERT, UPDATE, DELETE ON bform_uploads TO bform_admin;
GRANT SELECT ON bform_upload_history TO bform_admin;
```

### 6.2 API Authorization

```javascript
// Middleware to check permissions
const authorizeBFormAccess = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    if (requiredRole === 'view' && !['bform_viewer', 'bform_uploader', 'bform_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    if (requiredRole === 'upload' && !['bform_uploader', 'bform_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};
```

---

## 7. File Storage

### 7.1 File Structure

```
/uploads/
├── bforms/
│   ├── jan-jun-2026/
│   │   ├── 168BF_SPRING_FIELD_CHSL_MERGED.pdf
│   │   ├── 169BF_SOHAM_RESIDENCY_MERGED.pdf
│   │   └── ... (56 files)
│   ├── jul-dec-2026/
│   └── ...
├── logs/
└── temp/
```

### 7.2 File Naming Convention

```
{BFORM_NUMBER}_{SOCIETY_NAME}_{MERGED_OR_ORIGINAL}_{TIMESTAMP}.pdf
Example: 168BF_SPRING_FIELD_CHSL_MERGED_20260722_103000.pdf
```

---

## 8. Validation Rules

### 8.1 Business Rules

```
1. Each customer can have ONLY ONE B-Form per period/year
2. B-Form number must be valid (match existing pattern: \d{3}BF)
3. Period must be one of: 'Jan-Jun', 'Jul-Dec', 'Custom'
4. Year must be >= 2020
5. Upload date cannot be in future
6. File must be PDF format
7. File size must be <= 10MB
```

### 8.2 Validation Logic

```javascript
const validateBFormUpload = async (data) => {
  const errors = [];
  
  // Validate customer exists
  const customer = await Account.findById(data.customer_id);
  if (!customer) errors.push('Customer not found');
  
  // Validate B-Form number format
  if (!data.bform_number.match(/^\d{3}BF$/)) {
    errors.push('Invalid B-Form number format');
  }
  
  // Check duplicate
  const existing = await BFormUpload.findOne({
    customer_id: data.customer_id,
    year: data.year,
    period: data.period
  });
  if (existing) errors.push('B-Form already uploaded for this period');
  
  // Validate file
  if (!data.file.mimetype.includes('pdf')) {
    errors.push('File must be PDF');
  }
  if (data.file.size > 10 * 1024 * 1024) {
    errors.push('File size exceeds 10MB limit');
  }
  
  return errors;
};
```

---

## 9. Error Handling

### 9.1 Error Responses

```json
{
  "400 Bad Request": {
    "code": "INVALID_INPUT",
    "message": "Invalid B-Form number format",
    "field": "bform_number"
  },
  "404 Not Found": {
    "code": "RECORD_NOT_FOUND",
    "message": "B-Form upload record not found"
  },
  "409 Conflict": {
    "code": "DUPLICATE_UPLOAD",
    "message": "B-Form already uploaded for this period",
    "existing_id": "uuid-123"
  },
  "500 Internal Server Error": {
    "code": "SERVER_ERROR",
    "message": "An error occurred while processing your request"
  }
}
```

---

## Summary

✅ **Complete database schema** with audit trail
✅ **8 comprehensive API endpoints** for full CRUD operations
✅ **Integration points** with existing customers and F/E refill systems
✅ **Security controls** with role-based access
✅ **Data validation** and error handling
✅ **File storage** strategy with naming conventions
✅ **Triggers & automation** for tracking history
✅ **Ready for 56 societies** data population

**Ready for development implementation! 🚀**
