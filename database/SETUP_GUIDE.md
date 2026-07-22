# B-Form Upload Tracker - PostgreSQL Database Setup Guide

## Overview

This is a complete PostgreSQL database schema for tracking B-Form uploads from 56 societies organized in 3 batches:

- **Batch 1** (33 societies): 168BF - 200BF
- **Batch 2** (7 societies): 232BF - 238BF
- **Batch 3** (16 societies): 250BF - 265BF

## Files Provided

1. **schema.sql** - Database schema with 4 tables and indexes
2. **triggers.sql** - 8 triggers for automatic tracking and updates
3. **initial_data.sql** - Initialization script with 56 societies and sample data
4. **migration.sql** - Migration utilities and management functions

## Database Structure

### Tables

#### 1. bform_societies
Reference table for all 56 societies with contact information.

```sql
Columns:
- id (UUID)
- customer_id (VARCHAR 50) - B-Form ID (168BF, etc.)
- society_name (VARCHAR 255)
- batch_type (batch_1, batch_2, batch_3)
- status (active, inactive, suspended)
- contact_email, contact_phone
- last_upload_date (TIMESTAMP)
- created_at, updated_at (TIMESTAMP)
```

#### 2. bform_uploads
Main table tracking B-Form uploads with file details and status.

```sql
Columns:
- id (UUID)
- customer_id (VARCHAR 50) - FK to bform_societies
- batch_type (batch_1, batch_2, batch_3)
- year (INTEGER) - Filing year
- period (VARCHAR 20) - Q1, Q2, Q3, Q4, etc.
- file_name, file_path (VARCHAR, TEXT)
- file_size (BIGINT)
- upload_date (TIMESTAMP)
- status (pending, processing, completed, rejected, archived)
- uploaded_by (VARCHAR 100)
- rejection_reason (TEXT, nullable)
- number_of_forms (INTEGER)
- checksum (VARCHAR 64) - SHA256 for duplicate detection
- created_at, updated_at, deleted_at (TIMESTAMP) - Soft delete support
```

**Unique Constraint**: (customer_id, year, period, deleted_at)

#### 3. bform_upload_history
Audit trail for all status changes and modifications.

```sql
Columns:
- id (UUID)
- upload_id (UUID) - FK to bform_uploads
- previous_status, new_status (upload_status enum)
- changed_by (VARCHAR 100)
- changed_at (TIMESTAMP)
- change_reason (TEXT, nullable)
- ip_address (VARCHAR 45, nullable)
- created_at (TIMESTAMP)
```

#### 4. bform_upload_summary
Summary statistics aggregated by year and period.

```sql
Columns:
- id (UUID)
- year (INTEGER)
- period (VARCHAR 20)
- total_uploads, completed_uploads, pending_uploads (INTEGER)
- processing_uploads, rejected_uploads, archived_uploads (INTEGER)
- total_file_size (BIGINT)
- total_forms (INTEGER)
- batch_completion_rate (NUMERIC 5,2) - Percentage
- last_upload_date, last_updated_at (TIMESTAMP)
- created_at, updated_at (TIMESTAMP)
```

**Unique Constraint**: (year, period)

## Indexes

The schema includes 12 optimized indexes:

- **bform_uploads**: customer_id, year, period, upload_date, status, batch_type
- **bform_uploads (composite)**: (year, period), (customer_id, year, period)
- **bform_upload_history**: upload_id, changed_at, new_status
- **bform_upload_summary**: year, period, (year, period)
- **bform_societies**: batch_type, status

All indexes include `WHERE deleted_at IS NULL` for soft-deleted records.

## Triggers

### 1. trg_track_bform_upload_history
**Event**: AFTER UPDATE on bform_uploads (when status changes)
**Action**: Automatically creates history record with previous/new status

### 2. trg_update_summary_on_insert
**Event**: AFTER INSERT on bform_uploads
**Action**: Creates or updates summary record for the year/period

### 3. trg_update_summary_on_status_change
**Event**: AFTER UPDATE on bform_uploads (when status changes)
**Action**: Updates summary counts based on status transition

### 4. trg_calculate_completion_rate
**Event**: AFTER INSERT OR UPDATE on bform_upload_summary
**Action**: Calculates batch_completion_rate (completed / total * 100)

### 5. trg_update_society_last_upload
**Event**: AFTER INSERT on bform_uploads
**Action**: Updates society's last_upload_date

### 6. trg_prevent_duplicate_uploads
**Event**: BEFORE INSERT OR UPDATE on bform_uploads
**Action**: Prevents duplicate files using checksum verification

### 7. trg_soft_delete_upload
**Event**: BEFORE UPDATE on bform_uploads (when deleted_at set)
**Action**: Updates summary to remove from active counts

### 8. trg_update_summary_timestamp
**Event**: BEFORE UPDATE on bform_upload_summary
**Action**: Maintains updated_at timestamp

## Setup Instructions

### Step 1: Create PostgreSQL Database

```bash
# Using psql
psql -U postgres

# In psql console:
CREATE DATABASE bform_tracker;
```

### Step 2: Connect to Database

```bash
psql -U postgres -d bform_tracker
```

### Step 3: Execute SQL Scripts in Order

```sql
-- 1. Create schema with tables and indexes
\i schema.sql

-- 2. Create triggers for automation
\i triggers.sql

-- 3. Insert initial data (56 societies + samples)
\i initial_data.sql

-- 4. Load migration utilities
\i migration.sql
```

### Alternative: Single Command

```bash
psql -U postgres -d bform_tracker -f schema.sql -f triggers.sql -f initial_data.sql -f migration.sql
```

## Usage Examples

### Check Setup Status

```sql
-- View all societies
SELECT customer_id, society_name, batch_type, status 
FROM bform_societies 
ORDER BY batch_type, customer_id;

-- View migration history
SELECT * FROM migration_history ORDER BY applied_at DESC;
```

### View Statistics

```sql
-- Get batch statistics
SELECT * FROM fn_get_batch_statistics();

-- View summary by period
SELECT year, period, total_uploads, completed_uploads, 
       batch_completion_rate FROM bform_upload_summary 
ORDER BY year DESC, period DESC;

-- View upload patterns by society
SELECT * FROM fn_get_upload_patterns() 
WHERE total_uploads > 0 
ORDER BY total_uploads DESC;
```

### Monitor Uploads

```sql
-- Check a specific society's status
SELECT * FROM fn_get_society_upload_status('168BF');

-- View pending uploads
SELECT customer_id, society_name, year, period, upload_date, status
FROM bform_uploads bu
JOIN bform_societies bs ON bu.customer_id = bs.customer_id
WHERE bu.status IN ('pending', 'processing') AND bu.deleted_at IS NULL
ORDER BY bu.upload_date;

-- View rejected uploads with reasons
SELECT customer_id, society_name, year, period, file_name, 
       rejection_reason, updated_at
FROM bform_uploads bu
JOIN bform_societies bs ON bu.customer_id = bs.customer_id
WHERE bu.status = 'rejected' AND bu.deleted_at IS NULL
ORDER BY bu.updated_at DESC;
```

### Insert New Upload

```sql
INSERT INTO bform_uploads (
    customer_id,
    batch_type,
    year,
    period,
    file_name,
    file_path,
    file_size,
    upload_date,
    status,
    uploaded_by,
    number_of_forms,
    checksum
) VALUES (
    '168BF',
    'batch_1',
    2026,
    'Q2',
    'Riverside_Q2_2026.pdf',
    '/uploads/batch1/168BF_Q2_2026.pdf',
    1024000,
    CURRENT_TIMESTAMP,
    'pending',
    'admin@riverside-hs.org',
    48,
    'abc123def456'
);
-- Summary automatically updated by triggers
```

### Update Upload Status

```sql
UPDATE bform_uploads
SET status = 'processing', uploaded_by = 'processor@system.org'
WHERE id = 'upload-uuid-here';
-- History automatically created, summary automatically updated

UPDATE bform_uploads
SET status = 'completed'
WHERE customer_id = '168BF' AND year = 2026 AND period = 'Q2';

-- Reject with reason
UPDATE bform_uploads
SET status = 'rejected', 
    rejection_reason = 'Missing Form A and B'
WHERE id = 'upload-uuid-here';
```

### Generate Audit Report

```sql
-- Get audit report for Q1 2026
SELECT * FROM fn_get_audit_report(2026, 'Q1');
```

### Validate Data Integrity

```sql
-- Run comprehensive validation
SELECT * FROM fn_validate_data_integrity();
```

### Recalculate Summaries (after data fixes)

```sql
-- WARNING: Deletes and recalculates all summaries
SELECT * FROM fn_recalculate_all_summaries();
```

## Soft Delete Support

Records are soft-deleted (not physically removed) using `deleted_at` timestamp:

```sql
-- Soft delete an upload
UPDATE bform_uploads
SET deleted_at = CURRENT_TIMESTAMP
WHERE id = 'upload-uuid-here';

-- View only active records (default in queries)
SELECT * FROM bform_uploads WHERE deleted_at IS NULL;

-- View deleted records
SELECT * FROM bform_uploads WHERE deleted_at IS NOT NULL;

-- Permanently delete (warning: cannot be undone)
DELETE FROM bform_uploads WHERE id = 'upload-uuid-here';
```

## Backup & Restore

### Backup

```bash
# Full database backup
pg_dump -U postgres -d bform_tracker -f bform_tracker_backup.sql

# Only data (no schema)
pg_dump -U postgres -d bform_tracker -a -f bform_tracker_data.sql

# Custom format (faster restore)
pg_dump -U postgres -d bform_tracker -Fc -f bform_tracker_backup.dump
```

### Restore

```bash
# Restore full database
psql -U postgres -d bform_tracker -f bform_tracker_backup.sql

# Restore from custom format
pg_restore -U postgres -d bform_tracker bform_tracker_backup.dump
```

## Performance Optimization

### Monitor Query Performance

```sql
-- Enable query timing
\timing on

-- Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM bform_uploads 
WHERE year = 2026 AND status = 'completed';
```

### Vacuum & Analyze (Regular Maintenance)

```bash
# Run periodically (weekly or monthly)
psql -U postgres -d bform_tracker -c "VACUUM ANALYZE;"
```

### Index Statistics

```sql
-- Update index statistics
REINDEX INDEX idx_bform_uploads_customer_id;

-- Disable/enable indexes for bulk operations
ALTER INDEX idx_bform_uploads_customer_id UNUSABLE;  -- (if supported)
```

## Data Migration from Old System

If migrating from an existing system:

```sql
-- Template for inserting from external source
INSERT INTO bform_societies (customer_id, society_name, batch_type, status)
SELECT customer_code, society_full_name, batch_code, 'active'
FROM old_system.societies
WHERE customer_code BETWEEN '168' AND '200';  -- For Batch 1

-- Verify insertion
SELECT COUNT(*) FROM bform_societies WHERE batch_type = 'batch_1';
```

## Security Considerations

1. **User Roles**: Create limited-permission roles for different users
   ```sql
   CREATE ROLE upload_user LOGIN PASSWORD 'password';
   GRANT SELECT, INSERT, UPDATE ON bform_uploads TO upload_user;
   GRANT SELECT ON bform_societies TO upload_user;
   ```

2. **Audit Trail**: All changes are automatically tracked in history table

3. **Checksum Verification**: Prevent duplicate file uploads

4. **Soft Deletes**: Maintain full audit trail even for deleted records

## Troubleshooting

### Trigger Not Firing?
```sql
-- Check trigger status
SELECT trigger_name, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE event_object_schema = 'public';
```

### Summary Out of Sync?
```sql
-- Recalculate all summaries
SELECT * FROM fn_recalculate_all_summaries();
```

### Duplicate Upload Error?
```sql
-- Check for duplicate checksums
SELECT checksum, customer_id, year, period, COUNT(*) 
FROM bform_uploads 
WHERE deleted_at IS NULL 
GROUP BY checksum, customer_id, year, period 
HAVING COUNT(*) > 1;
```

### Performance Issues?
```sql
-- Analyze slow query
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM bform_uploads 
WHERE year = 2026 AND status = 'completed';

-- Rebuild indexes
REINDEX TABLE bform_uploads;
```

## Support

For issues or questions:
1. Check the SETUP_GUIDE.md (this file)
2. Review migration_history table for applied changes
3. Run fn_validate_data_integrity() to check consistency
4. Check trigger definitions in information_schema.triggers

## Version

- **Schema Version**: 1.0
- **Created**: 2026-07-22
- **Database**: PostgreSQL 12+
- **Total Tables**: 4
- **Total Triggers**: 8
- **Total Functions**: 10+
- **Initial Records**: 56 societies + sample uploads
