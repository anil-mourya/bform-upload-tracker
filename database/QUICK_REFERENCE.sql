-- B-Form Upload Tracker - Quick Reference SQL Commands
-- Common operations for day-to-day usage
-- Created: 2026-07-22

-- =============================================================================
-- SECTION 1: VIEWING DATA
-- =============================================================================

-- View all societies with their details
SELECT customer_id, society_name, batch_type, status, contact_email,
       last_upload_date FROM bform_societies ORDER BY batch_type, customer_id;

-- View society by batch
SELECT * FROM bform_societies WHERE batch_type = 'batch_1' ORDER BY customer_id;

-- Get specific society information
SELECT * FROM fn_get_society_upload_status('168BF');

-- View all active uploads
SELECT bu.customer_id, bs.society_name, bu.year, bu.period, bu.status,
       bu.upload_date, bu.file_name
FROM bform_uploads bu
JOIN bform_societies bs ON bu.customer_id = bs.customer_id
WHERE bu.deleted_at IS NULL
ORDER BY bu.upload_date DESC;

-- View uploads by status
SELECT customer_id, society_name, year, period, upload_date, status
FROM bform_uploads bu
JOIN bform_societies bs ON bu.customer_id = bs.customer_id
WHERE bu.status = 'pending' AND bu.deleted_at IS NULL
ORDER BY bu.upload_date;

-- View uploads needing action (pending or processing)
SELECT bu.customer_id, bs.society_name, bu.year, bu.period,
       bu.status, bu.uploaded_by, bu.upload_date,
       CASE WHEN bu.status = 'pending' THEN 'Awaiting processing'
            WHEN bu.status = 'processing' THEN 'Currently being processed'
            END as action_needed
FROM bform_uploads bu
JOIN bform_societies bs ON bu.customer_id = bs.customer_id
WHERE bu.status IN ('pending', 'processing') AND bu.deleted_at IS NULL
ORDER BY bu.upload_date;

-- =============================================================================
-- SECTION 2: STATISTICS & REPORTING
-- =============================================================================

-- Batch statistics
SELECT * FROM fn_get_batch_statistics();

-- Summary by period
SELECT year, period, total_uploads, completed_uploads, pending_uploads,
       rejected_uploads, total_file_size / 1024 / 1024 as file_size_mb,
       batch_completion_rate as completion_percent
FROM bform_upload_summary
ORDER BY year DESC, period DESC;

-- Current year summary
SELECT period, total_uploads, completed_uploads,
       ROUND(batch_completion_rate, 2) as completion_percent,
       total_forms, last_upload_date
FROM bform_upload_summary
WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY period;

-- Upload patterns - societies with most uploads
SELECT * FROM fn_get_upload_patterns()
WHERE total_uploads > 0
ORDER BY total_uploads DESC
LIMIT 10;

-- Inactive societies (no uploads)
SELECT customer_id, society_name, batch_type, contact_email
FROM bform_societies bs
WHERE NOT EXISTS (
    SELECT 1 FROM bform_uploads bu
    WHERE bu.customer_id = bs.customer_id AND bu.deleted_at IS NULL
)
ORDER BY batch_type, customer_id;

-- =============================================================================
-- SECTION 3: INSERT NEW UPLOAD
-- =============================================================================

-- Standard insert (all fields)
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
    1050000,
    CURRENT_TIMESTAMP,
    'pending',
    'admin@riverside-hs.org',
    48,
    'sha256hashvalue'
);

-- Insert with minimal fields (batch_type auto-determined)
INSERT INTO bform_uploads (
    customer_id,
    year,
    period,
    file_name,
    file_path,
    file_size,
    upload_date,
    status,
    uploaded_by
) VALUES (
    '169BF',
    2026,
    'Q2',
    'Greenfield_Q2_2026.pdf',
    '/uploads/batch1/169BF_Q2_2026.pdf',
    975000,
    CURRENT_TIMESTAMP,
    'pending',
    'admin@greenfield-coop.org'
);
-- Note: batch_type should be determined from customer_id or set explicitly

-- Batch insert multiple uploads
INSERT INTO bform_uploads (
    customer_id, batch_type, year, period, file_name, file_path,
    file_size, upload_date, status, uploaded_by
) VALUES
    ('168BF', 'batch_1', 2026, 'Q2', 'file1.pdf', '/uploads/file1.pdf', 1000000, CURRENT_TIMESTAMP, 'pending', 'user@example.com'),
    ('169BF', 'batch_1', 2026, 'Q2', 'file2.pdf', '/uploads/file2.pdf', 1100000, CURRENT_TIMESTAMP, 'pending', 'user@example.com'),
    ('170BF', 'batch_1', 2026, 'Q2', 'file3.pdf', '/uploads/file3.pdf', 950000, CURRENT_TIMESTAMP, 'pending', 'user@example.com');

-- =============================================================================
-- SECTION 4: UPDATE UPLOAD STATUS
-- =============================================================================

-- Update single upload to processing
UPDATE bform_uploads
SET status = 'processing',
    uploaded_by = 'processor@system.org'
WHERE id = 'uuid-here';

-- Update to completed
UPDATE bform_uploads
SET status = 'completed'
WHERE customer_id = '168BF' AND year = 2026 AND period = 'Q2';

-- Reject with reason
UPDATE bform_uploads
SET status = 'rejected',
    rejection_reason = 'Missing mandatory forms: Form A, Form B'
WHERE customer_id = '170BF' AND year = 2026 AND period = 'Q1';

-- Update multiple by criteria
UPDATE bform_uploads
SET status = 'processing',
    uploaded_by = 'admin@system.org'
WHERE year = 2026 AND period = 'Q1' AND status = 'pending'
  AND deleted_at IS NULL;

-- Mark as archived
UPDATE bform_uploads
SET status = 'archived'
WHERE year < 2025 AND status IN ('completed', 'rejected');

-- =============================================================================
-- SECTION 5: SOFT DELETE (Archive)
-- =============================================================================

-- Soft delete a single upload
UPDATE bform_uploads
SET deleted_at = CURRENT_TIMESTAMP
WHERE id = 'uuid-here';

-- Soft delete uploads for a specific period
UPDATE bform_uploads
SET deleted_at = CURRENT_TIMESTAMP
WHERE year = 2024 AND status = 'archived';

-- View deleted uploads
SELECT customer_id, file_name, status, deleted_at
FROM bform_uploads
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;

-- Restore a soft-deleted upload (undo soft delete)
UPDATE bform_uploads
SET deleted_at = NULL
WHERE id = 'uuid-here';

-- Permanent delete (WARNING: Cannot be undone)
DELETE FROM bform_uploads WHERE id = 'uuid-here';

-- =============================================================================
-- SECTION 6: VIEW AUDIT TRAIL & HISTORY
-- =============================================================================

-- View all history for a specific upload
SELECT previous_status, new_status, changed_by, changed_at, change_reason
FROM bform_upload_history
WHERE upload_id = 'upload-uuid-here'
ORDER BY changed_at ASC;

-- View status changes for a society in a period
SELECT bu.customer_id, bs.society_name, buh.previous_status, buh.new_status,
       buh.changed_by, buh.changed_at, buh.change_reason
FROM bform_upload_history buh
JOIN bform_uploads bu ON buh.upload_id = bu.id
JOIN bform_societies bs ON bu.customer_id = bs.customer_id
WHERE bu.customer_id = '168BF' AND bu.year = 2026 AND bu.period = 'Q1'
ORDER BY buh.changed_at DESC;

-- View all rejections with reasons
SELECT bu.customer_id, bs.society_name, bu.year, bu.period,
       buh.changed_at, buh.change_reason
FROM bform_upload_history buh
JOIN bform_uploads bu ON buh.upload_id = bu.id
JOIN bform_societies bs ON bu.customer_id = bs.customer_id
WHERE buh.new_status = 'rejected'
ORDER BY buh.changed_at DESC;

-- Audit report for a period
SELECT * FROM fn_get_audit_report(2026, 'Q1');

-- Recent activity (last 24 hours)
SELECT bu.customer_id, bs.society_name, buh.new_status,
       buh.changed_by, buh.changed_at
FROM bform_upload_history buh
JOIN bform_uploads bu ON buh.upload_id = bu.id
JOIN bform_societies bs ON bu.customer_id = bs.customer_id
WHERE buh.changed_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
ORDER BY buh.changed_at DESC;

-- =============================================================================
-- SECTION 7: DATA VALIDATION & INTEGRITY
-- =============================================================================

-- Validate data integrity
SELECT * FROM fn_validate_data_integrity();

-- Find orphaned uploads (customer_id not in societies)
SELECT bu.id, bu.customer_id, bu.file_name
FROM bform_uploads bu
WHERE NOT EXISTS (
    SELECT 1 FROM bform_societies bs WHERE bs.customer_id = bu.customer_id
)
AND bu.deleted_at IS NULL;

-- Check for duplicate files (same checksum)
SELECT checksum, customer_id, year, period, COUNT(*) as duplicate_count
FROM bform_uploads
WHERE deleted_at IS NULL AND checksum IS NOT NULL
GROUP BY checksum, customer_id, year, period
HAVING COUNT(*) > 1;

-- Find uploads without checksum
SELECT id, customer_id, file_name, upload_date
FROM bform_uploads
WHERE checksum IS NULL AND deleted_at IS NULL;

-- Find incomplete uploads (missing summary entry)
SELECT bu.year, bu.period
FROM (
    SELECT DISTINCT year, period FROM bform_uploads WHERE deleted_at IS NULL
) bu
WHERE NOT EXISTS (
    SELECT 1 FROM bform_upload_summary bus
    WHERE bus.year = bu.year AND bus.period = bu.period
);

-- =============================================================================
-- SECTION 8: MAINTENANCE & CLEANUP
-- =============================================================================

-- Recalculate all summaries (use after data fixes)
SELECT * FROM fn_recalculate_all_summaries();

-- Archive old history (returns count of records that would be deleted)
SELECT * FROM fn_archive_old_history(365);  -- Keep 1 year of history

-- Vacuum and analyze
VACUUM ANALYZE bform_uploads;
VACUUM ANALYZE bform_upload_summary;
VACUUM ANALYZE bform_upload_history;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan as usage
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- =============================================================================
-- SECTION 9: REPORTING QUERIES
-- =============================================================================

-- Monthly completion report
SELECT
    year,
    period,
    total_uploads,
    completed_uploads,
    pending_uploads,
    rejected_uploads,
    ROUND(batch_completion_rate, 2) as completion_percent
FROM bform_upload_summary
WHERE year = 2026
ORDER BY period;

-- Society upload frequency
SELECT
    customer_id,
    society_name,
    COUNT(DISTINCT year) as years_uploaded,
    COUNT(*) as total_uploads,
    MAX(upload_date) as last_upload,
    ROUND(AVG(file_size)/1024::NUMERIC, 2) as avg_file_size_kb
FROM bform_uploads bu
JOIN bform_societies bs ON bu.customer_id = bs.customer_id
WHERE bu.deleted_at IS NULL
GROUP BY bu.customer_id, bs.society_name
ORDER BY COUNT(*) DESC;

-- Batch performance comparison
SELECT
    bs.batch_type,
    COUNT(DISTINCT bs.customer_id) as societies_count,
    COUNT(bu.id) as total_uploads,
    COUNT(CASE WHEN bu.status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN bu.status = 'rejected' THEN 1 END) as rejected,
    ROUND(100.0 * COUNT(CASE WHEN bu.status = 'completed' THEN 1 END) /
          NULLIF(COUNT(bu.id), 0), 2) as success_rate
FROM bform_societies bs
LEFT JOIN bform_uploads bu ON bs.customer_id = bu.customer_id AND bu.deleted_at IS NULL
GROUP BY bs.batch_type
ORDER BY bs.batch_type;

-- Rejection analysis
SELECT
    rejection_reason,
    COUNT(*) as rejection_count,
    COUNT(DISTINCT customer_id) as affected_societies
FROM bform_uploads
WHERE status = 'rejected' AND deleted_at IS NULL
GROUP BY rejection_reason
ORDER BY rejection_count DESC;

-- =============================================================================
-- SECTION 10: PERFORMANCE QUERIES
-- =============================================================================

-- Explain analyze for performance tuning
EXPLAIN ANALYZE
SELECT bu.customer_id, bu.year, bu.period, bu.status, COUNT(*) as cnt
FROM bform_uploads bu
WHERE bu.year = 2026 AND bu.status = 'completed' AND bu.deleted_at IS NULL
GROUP BY bu.customer_id, bu.year, bu.period, bu.status;

-- Find slow queries in history
SELECT buh.changed_at, COUNT(*) as operation_count
FROM bform_upload_history buh
WHERE buh.changed_at > CURRENT_TIMESTAMP - INTERVAL '1 day'
GROUP BY DATE(buh.changed_at)
ORDER BY buh.changed_at DESC;

-- =============================================================================
-- SECTION 11: ADMIN FUNCTIONS
-- =============================================================================

-- View migration history
SELECT migration_name, applied_at, execution_time_ms, status
FROM migration_history
ORDER BY applied_at DESC;

-- Record a manual migration
SELECT fn_record_migration('manual_fix_20260722', 150, 'success');

-- Check all function definitions
SELECT proname, pronargs, prorettype
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- Check all trigger definitions
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =============================================================================
-- SECTION 12: USER MANAGEMENT (IF NEEDED)
-- =============================================================================

-- Create read-only user
CREATE ROLE readonly_user LOGIN PASSWORD 'password';
GRANT CONNECT ON DATABASE bform_tracker TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

-- Create upload processor user
CREATE ROLE upload_processor LOGIN PASSWORD 'password';
GRANT CONNECT ON DATABASE bform_tracker TO upload_processor;
GRANT USAGE ON SCHEMA public TO upload_processor;
GRANT SELECT, INSERT, UPDATE ON bform_uploads TO upload_processor;
GRANT SELECT ON bform_societies TO upload_processor;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO upload_processor;

-- Create admin user
CREATE ROLE admin_user LOGIN PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE bform_tracker TO admin_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin_user;

-- =============================================================================
-- NOTES
-- =============================================================================

-- Soft Deletes:
-- All active queries include "WHERE deleted_at IS NULL"
-- Soft-deleted records remain in database for audit trail

-- Automatic Features (Triggered):
-- - Status changes automatically create history records
-- - Summary statistics update automatically
-- - Society last_upload_date updates automatically
-- - Completion rate calculated automatically
-- - Duplicate files prevented by checksum

-- Indexes:
-- Indexes on: customer_id, year, period, upload_date, status, batch_type
-- All queries should use indexed columns in WHERE clause

-- Performance:
-- Use year+period for quick period lookups
-- Use customer_id for society-specific queries
-- Use status for filtering active/completed records
