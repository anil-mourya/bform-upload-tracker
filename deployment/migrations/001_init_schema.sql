-- ============================================================
-- B-Form Upload Tracker - Initial Database Schema
-- Version: 1.0.0
-- Created: 2024
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  role VARCHAR(50) DEFAULT 'user',
  department VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  password_changed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================
-- ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Administrator with full access', '{"all": true}'),
  ('manager', 'Manager with team oversight', '{"manage_team": true, "view_reports": true}'),
  ('user', 'Regular user', '{"submit_forms": true, "view_own_forms": true}'),
  ('viewer', 'Read-only access', '{"view_forms": true}');

-- ============================================================
-- B-FORMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS b_forms (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  equipment_name VARCHAR(255) NOT NULL,
  equipment_type VARCHAR(100),
  serial_number VARCHAR(255),
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  installation_date DATE,
  expiry_date DATE,
  renewal_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  priority VARCHAR(50) DEFAULT 'normal',
  document_url VARCHAR(500),
  document_size INTEGER,
  document_name VARCHAR(255),
  notes TEXT,
  tags VARCHAR(255)[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_b_forms_user_id ON b_forms(user_id);
CREATE INDEX idx_b_forms_uuid ON b_forms(uuid);
CREATE INDEX idx_b_forms_status ON b_forms(status);
CREATE INDEX idx_b_forms_expiry_date ON b_forms(expiry_date);
CREATE INDEX idx_b_forms_created_at ON b_forms(created_at);
CREATE INDEX idx_b_forms_registration_number ON b_forms(registration_number);
CREATE INDEX idx_b_forms_tags ON b_forms USING GIN(tags);

-- ============================================================
-- FORM SUBMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS form_submissions (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
  b_form_id INTEGER NOT NULL REFERENCES b_forms(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  renewal_date DATE,
  document_url VARCHAR(500),
  document_size INTEGER,
  document_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  rejection_reason TEXT,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_form_submissions_b_form_id ON form_submissions(b_form_id);
CREATE INDEX idx_form_submissions_uuid ON form_submissions(uuid);
CREATE INDEX idx_form_submissions_user_id ON form_submissions(user_id);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_submission_date ON form_submissions(submission_date);
CREATE INDEX idx_form_submissions_created_at ON form_submissions(created_at);

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  entity_uuid UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  changes JSONB,
  status VARCHAR(50) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================
-- ACTIVITY LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  b_form_id INTEGER REFERENCES b_forms(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_b_form_id ON activity_logs(b_form_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================================
-- SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);

-- ============================================================
-- MIGRATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TRIGGER FUNCTIONS
-- ============================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit log trigger
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, entity_uuid, changes, status)
    VALUES (
      CURRENT_SETTING('app.user_id')::INT,
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      NEW.uuid,
      row_to_json(NEW),
      'success'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, entity_uuid, changes, status)
    VALUES (
      CURRENT_SETTING('app.user_id')::INT,
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      NEW.uuid,
      jsonb_build_object(
        'before', row_to_json(OLD),
        'after', row_to_json(NEW)
      ),
      'success'
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, entity_uuid, changes, status)
    VALUES (
      CURRENT_SETTING('app.user_id')::INT,
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      OLD.uuid,
      row_to_json(OLD),
      'success'
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CREATE TRIGGERS
-- ============================================================

CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_b_forms_updated_at
BEFORE UPDATE ON b_forms
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_form_submissions_updated_at
BEFORE UPDATE ON form_submissions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_audit_log_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER trigger_audit_log_b_forms
AFTER INSERT OR UPDATE OR DELETE ON b_forms
FOR EACH ROW
EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER trigger_audit_log_form_submissions
AFTER INSERT OR UPDATE OR DELETE ON form_submissions
FOR EACH ROW
EXECUTE FUNCTION audit_log_changes();

-- ============================================================
-- RECORD INITIALIZATION
-- ============================================================

INSERT INTO migrations (name) VALUES ('001_init_schema.sql') ON CONFLICT DO NOTHING;
