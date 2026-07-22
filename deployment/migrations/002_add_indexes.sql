-- ============================================================
-- Add Performance Indexes and Optimizations
-- Version: 2.0.0
-- ============================================================

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_b_forms_equipment_name_search
  ON b_forms USING GIN(to_tsvector('english', equipment_name));

CREATE INDEX IF NOT EXISTS idx_b_forms_notes_search
  ON b_forms USING GIN(to_tsvector('english', notes));

CREATE INDEX IF NOT EXISTS idx_users_full_name_search
  ON users USING GIN(to_tsvector('english', full_name));

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_b_forms_active
  ON b_forms(id) WHERE deleted_at IS NULL AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_users_active
  ON users(id) WHERE deleted_at IS NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_form_submissions_pending
  ON form_submissions(id) WHERE deleted_at IS NULL AND status = 'pending';

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_b_forms_user_status
  ON b_forms(user_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_form_submissions_b_form_status
  ON form_submissions(b_form_id, status) WHERE deleted_at IS NULL;

-- Expiry date monitoring
CREATE INDEX IF NOT EXISTS idx_b_forms_expiry_monitoring
  ON b_forms(expiry_date) WHERE status = 'active' AND deleted_at IS NULL;

-- Audit and compliance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp_action
  ON audit_logs(created_at DESC, action);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_timestamp
  ON activity_logs(user_id, created_at DESC);

-- Session management
CREATE INDEX IF NOT EXISTS idx_sessions_active
  ON sessions(user_id) WHERE expires_at > CURRENT_TIMESTAMP;

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id) WHERE read = false;

-- Add statistics for query planner
ANALYZE;

-- Record migration
INSERT INTO migrations (name) VALUES ('002_add_indexes.sql') ON CONFLICT DO NOTHING;
