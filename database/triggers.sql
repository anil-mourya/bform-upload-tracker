-- B-Form Upload Tracker Triggers
-- PostgreSQL Triggers for History Tracking and Summary Updates
-- Created: 2026-07-22

-- ============================================================================
-- TRIGGER 1: Automatic history tracking on bform_uploads status changes
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_track_bform_upload_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only insert history if status has changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO bform_upload_history (
            upload_id,
            previous_status,
            new_status,
            changed_by,
            changed_at,
            change_reason
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NEW.uploaded_by, 'system'),
            CURRENT_TIMESTAMP,
            CASE
                WHEN NEW.status = 'rejected' THEN NEW.rejection_reason
                ELSE NULL
            END
        );
    END IF;

    -- Update the updated_at timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_track_bform_upload_history
AFTER UPDATE ON bform_uploads
FOR EACH ROW
EXECUTE FUNCTION fn_track_bform_upload_history();

COMMENT ON FUNCTION fn_track_bform_upload_history() IS 'Automatically records status changes in history table';

-- ============================================================================
-- TRIGGER 2: Update summary statistics when upload status changes
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_update_bform_summary_on_upload_change()
RETURNS TRIGGER AS $$
DECLARE
    v_year INTEGER;
    v_period VARCHAR(20);
BEGIN
    v_year := NEW.year;
    v_period := NEW.period;

    -- Insert or update summary record
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
        last_updated_at
    ) VALUES (
        v_year,
        v_period,
        1,
        CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'pending' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'processing' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'rejected' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'archived' THEN 1 ELSE 0 END,
        NEW.file_size,
        COALESCE(NEW.number_of_forms, 0),
        NEW.upload_date,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (year, period) DO UPDATE SET
        total_uploads = bform_upload_summary.total_uploads + 1,
        completed_uploads = bform_upload_summary.completed_uploads +
            CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
        pending_uploads = bform_upload_summary.pending_uploads +
            CASE WHEN NEW.status = 'pending' THEN 1 ELSE 0 END,
        processing_uploads = bform_upload_summary.processing_uploads +
            CASE WHEN NEW.status = 'processing' THEN 1 ELSE 0 END,
        rejected_uploads = bform_upload_summary.rejected_uploads +
            CASE WHEN NEW.status = 'rejected' THEN 1 ELSE 0 END,
        archived_uploads = bform_upload_summary.archived_uploads +
            CASE WHEN NEW.status = 'archived' THEN 1 ELSE 0 END,
        total_file_size = bform_upload_summary.total_file_size + NEW.file_size,
        total_forms = bform_upload_summary.total_forms + COALESCE(NEW.number_of_forms, 0),
        last_upload_date = GREATEST(bform_upload_summary.last_upload_date, NEW.upload_date),
        last_updated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_summary_on_insert
AFTER INSERT ON bform_uploads
FOR EACH ROW
EXECUTE FUNCTION fn_update_bform_summary_on_upload_change();

COMMENT ON FUNCTION fn_update_bform_summary_on_upload_change() IS 'Updates summary statistics when new upload is added';

-- ============================================================================
-- TRIGGER 3: Update summary on upload status changes
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_update_bform_summary_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_year INTEGER;
    v_period VARCHAR(20);
BEGIN
    v_year := NEW.year;
    v_period := NEW.period;

    IF OLD.status IS DISTINCT FROM NEW.status THEN
        UPDATE bform_upload_summary SET
            completed_uploads = completed_uploads -
                CASE WHEN OLD.status = 'completed' THEN 1 ELSE 0 END +
                CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
            pending_uploads = pending_uploads -
                CASE WHEN OLD.status = 'pending' THEN 1 ELSE 0 END +
                CASE WHEN NEW.status = 'pending' THEN 1 ELSE 0 END,
            processing_uploads = processing_uploads -
                CASE WHEN OLD.status = 'processing' THEN 1 ELSE 0 END +
                CASE WHEN NEW.status = 'processing' THEN 1 ELSE 0 END,
            rejected_uploads = rejected_uploads -
                CASE WHEN OLD.status = 'rejected' THEN 1 ELSE 0 END +
                CASE WHEN NEW.status = 'rejected' THEN 1 ELSE 0 END,
            archived_uploads = archived_uploads -
                CASE WHEN OLD.status = 'archived' THEN 1 ELSE 0 END +
                CASE WHEN NEW.status = 'archived' THEN 1 ELSE 0 END,
            last_updated_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE year = v_year AND period = v_period;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_summary_on_status_change
AFTER UPDATE ON bform_uploads
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION fn_update_bform_summary_on_status_change();

COMMENT ON FUNCTION fn_update_bform_summary_on_status_change() IS 'Updates summary statistics when upload status changes';

-- ============================================================================
-- TRIGGER 4: Calculate batch completion rate
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_calculate_batch_completion_rate()
RETURNS TRIGGER AS $$
DECLARE
    v_completion_rate NUMERIC(5, 2);
BEGIN
    SELECT
        CASE
            WHEN total_uploads = 0 THEN 0
            ELSE ROUND((completed_uploads::NUMERIC / total_uploads * 100), 2)
        END INTO v_completion_rate
    FROM bform_upload_summary
    WHERE id = NEW.id;

    UPDATE bform_upload_summary SET
        batch_completion_rate = v_completion_rate,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_completion_rate
AFTER INSERT OR UPDATE ON bform_upload_summary
FOR EACH ROW
EXECUTE FUNCTION fn_calculate_batch_completion_rate();

COMMENT ON FUNCTION fn_calculate_batch_completion_rate() IS 'Automatically calculates batch completion rate';

-- ============================================================================
-- TRIGGER 5: Update society last upload date
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_update_society_last_upload_date()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE bform_societies SET
        last_upload_date = NEW.upload_date,
        updated_at = CURRENT_TIMESTAMP
    WHERE customer_id = NEW.customer_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_society_last_upload
AFTER INSERT ON bform_uploads
FOR EACH ROW
EXECUTE FUNCTION fn_update_society_last_upload_date();

COMMENT ON FUNCTION fn_update_society_last_upload_date() IS 'Updates society last_upload_date when new upload is added';

-- ============================================================================
-- TRIGGER 6: Prevent upload of duplicate file (same checksum)
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_prevent_duplicate_uploads()
RETURNS TRIGGER AS $$
DECLARE
    v_existing_id UUID;
BEGIN
    IF NEW.checksum IS NOT NULL THEN
        SELECT id INTO v_existing_id
        FROM bform_uploads
        WHERE checksum = NEW.checksum
            AND customer_id = NEW.customer_id
            AND year = NEW.year
            AND period = NEW.period
            AND deleted_at IS NULL
            AND id != NEW.id
        LIMIT 1;

        IF v_existing_id IS NOT NULL THEN
            RAISE EXCEPTION 'Duplicate file upload detected. File checksum already exists for this society in this period.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_uploads
BEFORE INSERT OR UPDATE ON bform_uploads
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_duplicate_uploads();

COMMENT ON FUNCTION fn_prevent_duplicate_uploads() IS 'Prevents duplicate file uploads using checksum verification';

-- ============================================================================
-- TRIGGER 7: Soft delete support - archive instead of delete
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_soft_delete_bform_upload()
RETURNS TRIGGER AS $$
BEGIN
    -- Update deleted_at when deleted
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        -- Update summary to remove from active counts
        UPDATE bform_upload_summary SET
            total_uploads = total_uploads - 1,
            completed_uploads = CASE WHEN OLD.status = 'completed' THEN completed_uploads - 1 ELSE completed_uploads END,
            pending_uploads = CASE WHEN OLD.status = 'pending' THEN pending_uploads - 1 ELSE pending_uploads END,
            processing_uploads = CASE WHEN OLD.status = 'processing' THEN processing_uploads - 1 ELSE processing_uploads END,
            rejected_uploads = CASE WHEN OLD.status = 'rejected' THEN rejected_uploads - 1 ELSE rejected_uploads END,
            archived_uploads = CASE WHEN OLD.status = 'archived' THEN archived_uploads - 1 ELSE archived_uploads END,
            total_file_size = total_file_size - OLD.file_size,
            total_forms = total_forms - COALESCE(OLD.number_of_forms, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE year = OLD.year AND period = OLD.period;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_soft_delete_upload
BEFORE UPDATE ON bform_uploads
FOR EACH ROW
WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
EXECUTE FUNCTION fn_soft_delete_bform_upload();

COMMENT ON FUNCTION fn_soft_delete_bform_upload() IS 'Handles soft delete by archiving and updating summary';

-- ============================================================================
-- TRIGGER 8: Maintain updated_at on summary updates
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_update_summary_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_summary_timestamp
BEFORE UPDATE ON bform_upload_summary
FOR EACH ROW
EXECUTE FUNCTION fn_update_summary_timestamp();

CREATE TRIGGER trg_update_societies_timestamp
BEFORE UPDATE ON bform_societies
FOR EACH ROW
EXECUTE FUNCTION fn_update_summary_timestamp();

COMMENT ON FUNCTION fn_update_summary_timestamp() IS 'Maintains updated_at timestamp on record updates';
