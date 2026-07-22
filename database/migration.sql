-- B-Form Upload Tracker - Migration & Management Scripts
-- Utility functions and procedures for database management
-- Created: 2026-07-22

-- ============================================================================
-- MIGRATION VERSION TABLE (for tracking applied migrations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS migration_history (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'success'
);

-- ============================================================================
-- UTILITY FUNCTIONS FOR MAINTENANCE
-- ============================================================================

-- Function to get upload statistics by batch
CREATE OR REPLACE FUNCTION fn_get_batch_statistics()
RETURNS TABLE (
    batch_type TEXT,
    total_societies BIGINT,
    total_uploads BIGINT,
    active_uploads BIGINT,
    completed_uploads BIGINT,
    pending_uploads BIGINT,
    rejected_uploads BIGINT,
    average_upload_size_mb NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bs.batch_type::text,
        COUNT(DISTINCT bs.id),
        COUNT(bu.id),
        COUNT(CASE WHEN bu.deleted_at IS NULL THEN 1 END),
        COUNT(CASE WHEN bu.status = 'completed' AND bu.deleted_at IS NULL THEN 1 END),
        COUNT(CASE WHEN bu.status = 'pending' AND bu.deleted_at IS NULL THEN 1 END),
        COUNT(CASE WHEN bu.status = 'rejected' AND bu.deleted_at IS NULL THEN 1 END),
        ROUND(AVG(bu.file_size)::NUMERIC / 1024 / 1024, 2)
    FROM bform_societies bs
    LEFT JOIN bform_uploads bu ON bs.customer_id = bu.customer_id
    GROUP BY bs.batch_type
    ORDER BY bs.batch_type;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_batch_statistics() IS 'Returns comprehensive statistics by batch';

-- Function to get upload status by society
CREATE OR REPLACE FUNCTION fn_get_society_upload_status(p_customer_id VARCHAR)
RETURNS TABLE (
    society_name VARCHAR(255),
    total_uploads BIGINT,
    completed BIGINT,
    pending BIGINT,
    processing BIGINT,
    rejected BIGINT,
    last_upload TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bs.society_name,
        COUNT(bu.id),
        COUNT(CASE WHEN bu.status = 'completed' THEN 1 END),
        COUNT(CASE WHEN bu.status = 'pending' THEN 1 END),
        COUNT(CASE WHEN bu.status = 'processing' THEN 1 END),
        COUNT(CASE WHEN bu.status = 'rejected' THEN 1 END),
        MAX(bu.upload_date)
    FROM bform_societies bs
    LEFT JOIN bform_uploads bu ON bs.customer_id = bu.customer_id AND bu.deleted_at IS NULL
    WHERE bs.customer_id = p_customer_id
    GROUP BY bs.customer_id, bs.society_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_society_upload_status() IS 'Returns upload status for a specific society';

-- Function to clean up old audit history (archive to separate table before deletion)
CREATE OR REPLACE FUNCTION fn_archive_old_history(p_days_to_keep INTEGER DEFAULT 365)
RETURNS TABLE (
    archived_records BIGINT,
    oldest_deleted_date TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_cutoff_date TIMESTAMP WITH TIME ZONE;
    v_affected_rows BIGINT;
BEGIN
    v_cutoff_date := CURRENT_TIMESTAMP - (p_days_to_keep || ' days')::INTERVAL;

    -- In production, you would archive to a separate history archive table
    -- For now, we just count what would be deleted
    SELECT COUNT(*) INTO v_affected_rows
    FROM bform_upload_history
    WHERE changed_at < v_cutoff_date;

    RETURN QUERY
    SELECT
        v_affected_rows,
        MIN(changed_at)
    FROM bform_upload_history
    WHERE changed_at < v_cutoff_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_archive_old_history() IS 'Archives old history records (simulate deletion count)';

-- Function to recalculate all summaries (useful after data fixes)
CREATE OR REPLACE FUNCTION fn_recalculate_all_summaries()
RETURNS TABLE (
    year INTEGER,
    period VARCHAR(20),
    recalculated BOOLEAN
) AS $$
BEGIN
    -- Delete existing summaries
    DELETE FROM bform_upload_summary;

    -- Recalculate summaries from bform_uploads
    INSERT INTO bform_upload_summary (
        year,
        period,
        total_uploads,
        completed_uploads,
        pending_uploads,
        processing_uploads,
        rejected_uploads,
        archived_uploads,
        total_file_size,
        total_forms,
        last_upload_date,
        batch_completion_rate
    )
    SELECT
        bu.year,
        bu.period,
        COUNT(*),
        COUNT(CASE WHEN bu.status = 'completed' AND bu.deleted_at IS NULL THEN 1 END),
        COUNT(CASE WHEN bu.status = 'pending' AND bu.deleted_at IS NULL THEN 1 END),
        COUNT(CASE WHEN bu.status = 'processing' AND bu.deleted_at IS NULL THEN 1 END),
        COUNT(CASE WHEN bu.status = 'rejected' AND bu.deleted_at IS NULL THEN 1 END),
        COUNT(CASE WHEN bu.status = 'archived' AND bu.deleted_at IS NULL THEN 1 END),
        COALESCE(SUM(bu.file_size), 0),
        COALESCE(SUM(bu.number_of_forms), 0),
        MAX(bu.upload_date),
        ROUND(COUNT(CASE WHEN bu.status = 'completed' AND bu.deleted_at IS NULL THEN 1 END)::NUMERIC /
              COUNT(CASE WHEN bu.deleted_at IS NULL THEN 1 END) * 100, 2)
    FROM bform_uploads bu
    WHERE bu.deleted_at IS NULL
    GROUP BY bu.year, bu.period;

    RETURN QUERY
    SELECT
        year,
        period,
        true as recalculated
    FROM bform_upload_summary
    ORDER BY year DESC, period DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_recalculate_all_summaries() IS 'Recalculates all summary statistics from scratch';

-- Function to generate audit report for a specific period
CREATE OR REPLACE FUNCTION fn_get_audit_report(p_year INTEGER, p_period VARCHAR)
RETURNS TABLE (
    society_id VARCHAR(50),
    society_name VARCHAR(255),
    initial_status upload_status,
    final_status upload_status,
    status_changes INTEGER,
    last_changed_at TIMESTAMP WITH TIME ZONE,
    uploaded_by VARCHAR(100),
    upload_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bu.customer_id,
        bs.society_name,
        (
            SELECT new_status
            FROM bform_upload_history
            WHERE upload_id = bu.id
            ORDER BY changed_at ASC
            LIMIT 1
        ) as initial_status,
        bu.status,
        COUNT(buh.id),
        MAX(buh.changed_at),
        bu.uploaded_by,
        bu.upload_date
    FROM bform_uploads bu
    LEFT JOIN bform_societies bs ON bu.customer_id = bs.customer_id
    LEFT JOIN bform_upload_history buh ON bu.id = buh.upload_id
    WHERE bu.year = p_year AND bu.period = p_period AND bu.deleted_at IS NULL
    GROUP BY bu.id, bu.customer_id, bs.society_name, bu.status, bu.uploaded_by, bu.upload_date
    ORDER BY bu.customer_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_audit_report() IS 'Generates detailed audit report for a specific period';

-- Function to identify uploading patterns (which societies upload regularly)
CREATE OR REPLACE FUNCTION fn_get_upload_patterns()
RETURNS TABLE (
    customer_id VARCHAR(50),
    society_name VARCHAR(255),
    total_uploads BIGINT,
    years_active INTEGER,
    avg_upload_size_mb NUMERIC,
    last_upload_date TIMESTAMP WITH TIME ZONE,
    upload_frequency VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bs.customer_id,
        bs.society_name,
        COUNT(bu.id),
        COUNT(DISTINCT bu.year),
        ROUND(AVG(bu.file_size)::NUMERIC / 1024 / 1024, 2),
        MAX(bu.upload_date),
        CASE
            WHEN COUNT(DISTINCT bu.year) > 0 THEN 'Regular'
            ELSE 'Inactive'
        END
    FROM bform_societies bs
    LEFT JOIN bform_uploads bu ON bs.customer_id = bu.customer_id AND bu.deleted_at IS NULL
    GROUP BY bs.customer_id, bs.society_name
    ORDER BY COUNT(bu.id) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_upload_patterns() IS 'Identifies upload patterns and frequency by society';

-- ============================================================================
-- DATA VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate data integrity
CREATE OR REPLACE FUNCTION fn_validate_data_integrity()
RETURNS TABLE (
    check_name VARCHAR(100),
    status VARCHAR(20),
    details TEXT
) AS $$
DECLARE
    v_orphaned_uploads INTEGER;
    v_invalid_checksums INTEGER;
    v_inconsistent_summaries INTEGER;
BEGIN
    -- Check for orphaned uploads (customer_id not in societies)
    SELECT COUNT(*) INTO v_orphaned_uploads
    FROM bform_uploads bu
    WHERE NOT EXISTS (
        SELECT 1 FROM bform_societies bs WHERE bs.customer_id = bu.customer_id
    );

    RETURN QUERY
    SELECT
        'Orphaned Uploads'::VARCHAR(100),
        CASE WHEN v_orphaned_uploads = 0 THEN 'PASS' ELSE 'FAIL' END,
        'Found ' || v_orphaned_uploads::TEXT || ' uploads without matching society'::TEXT;

    -- Check for invalid year values
    RETURN QUERY
    SELECT
        'Valid Year Range'::VARCHAR(100),
        CASE
            WHEN COUNT(*) = 0 THEN 'PASS'
            ELSE 'FAIL'
        END,
        'Found ' || COUNT(*)::TEXT || ' uploads with invalid year'
    FROM bform_uploads
    WHERE year < 2000 OR year > 2100;

    -- Check for null critical fields
    RETURN QUERY
    SELECT
        'Null Field Validation'::VARCHAR(100),
        CASE
            WHEN COUNT(*) = 0 THEN 'PASS'
            ELSE 'FAIL'
        END,
        'Found ' || COUNT(*)::TEXT || ' uploads with null critical fields'
    FROM bform_uploads
    WHERE customer_id IS NULL OR file_name IS NULL OR uploaded_by IS NULL;

    -- Check summary consistency
    RETURN QUERY
    SELECT
        'Summary Consistency'::VARCHAR(100),
        'INFO',
        'Total uploads: ' || (SELECT COUNT(*) FROM bform_uploads WHERE deleted_at IS NULL)::TEXT ||
        ', Total in summaries: ' || (SELECT SUM(total_uploads) FROM bform_upload_summary)::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_validate_data_integrity() IS 'Validates database integrity and consistency';

-- ============================================================================
-- MIGRATION EXECUTION FUNCTION
-- ============================================================================

-- Function to record migration execution
CREATE OR REPLACE FUNCTION fn_record_migration(
    p_migration_name VARCHAR,
    p_execution_time_ms INTEGER DEFAULT 0,
    p_status VARCHAR DEFAULT 'success'
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO migration_history (migration_name, execution_time_ms, status)
    VALUES (p_migration_name, p_execution_time_ms, p_status);
    RETURN TRUE;
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'Migration % already applied', p_migration_name;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_record_migration() IS 'Records applied migrations for tracking';

-- ============================================================================
-- SAMPLE QUERIES FOR REPORTING
-- ============================================================================

-- Query 1: Overall System Health
/*
SELECT
    (SELECT COUNT(*) FROM bform_societies) as total_societies,
    (SELECT COUNT(*) FROM bform_uploads WHERE deleted_at IS NULL) as active_uploads,
    (SELECT COUNT(*) FROM bform_uploads WHERE status = 'completed' AND deleted_at IS NULL) as completed,
    (SELECT COUNT(*) FROM bform_uploads WHERE status = 'pending' AND deleted_at IS NULL) as pending,
    (SELECT COUNT(*) FROM bform_uploads WHERE status = 'rejected' AND deleted_at IS NULL) as rejected,
    ROUND((SELECT COALESCE(SUM(file_size), 0) FROM bform_uploads WHERE deleted_at IS NULL)::NUMERIC / 1024 / 1024 / 1024, 2) as total_storage_gb;
*/

-- Query 2: Period-wise completion rate
/*
SELECT
    year,
    period,
    total_uploads,
    completed_uploads,
    ROUND(batch_completion_rate, 2) as completion_rate_percent,
    last_upload_date
FROM bform_upload_summary
ORDER BY year DESC, period DESC;
*/

-- Query 3: Pending uploads requiring action
/*
SELECT
    bu.customer_id,
    bs.society_name,
    bu.year,
    bu.period,
    bu.upload_date,
    bu.status,
    bu.uploaded_by
FROM bform_uploads bu
JOIN bform_societies bs ON bu.customer_id = bs.customer_id
WHERE bu.status IN ('pending', 'processing') AND bu.deleted_at IS NULL
ORDER BY bu.upload_date ASC;
*/

-- Query 4: Recent rejections with reasons
/*
SELECT
    bu.customer_id,
    bs.society_name,
    bu.year,
    bu.period,
    bu.file_name,
    bu.rejection_reason,
    bu.updated_at
FROM bform_uploads bu
JOIN bform_societies bs ON bu.customer_id = bs.customer_id
WHERE bu.status = 'rejected' AND bu.deleted_at IS NULL
ORDER BY bu.updated_at DESC
LIMIT 10;
*/

-- ============================================================================
-- ROLLBACK FUNCTION (for safety)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_reset_database()
RETURNS TABLE (
    table_name VARCHAR(100),
    rows_deleted BIGINT
) AS $$
DECLARE
    v_row_count BIGINT;
BEGIN
    -- Delete in dependency order
    DELETE FROM bform_upload_history;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    RETURN QUERY SELECT 'bform_upload_history'::VARCHAR(100), v_row_count;

    DELETE FROM bform_upload_summary;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    RETURN QUERY SELECT 'bform_upload_summary'::VARCHAR(100), v_row_count;

    DELETE FROM bform_uploads;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    RETURN QUERY SELECT 'bform_uploads'::VARCHAR(100), v_row_count;

    DELETE FROM bform_societies;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    RETURN QUERY SELECT 'bform_societies'::VARCHAR(100), v_row_count;

    TRUNCATE TABLE migration_history;
    RETURN QUERY SELECT 'migration_history'::VARCHAR(100), 0::BIGINT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_reset_database() IS 'WARNING: Resets all application data (use with caution)';

-- ============================================================================
-- MIGRATION TRACKING
-- ============================================================================

-- Record initial schema migration
INSERT INTO migration_history (migration_name, status)
VALUES
    ('001_create_schema', 'success'),
    ('002_create_triggers', 'success'),
    ('003_insert_initial_data', 'success')
ON CONFLICT (migration_name) DO NOTHING;

-- Display migration status
SELECT * FROM migration_history ORDER BY id DESC LIMIT 10;
