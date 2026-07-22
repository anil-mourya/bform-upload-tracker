-- B-Form Upload Tracker Schema
-- PostgreSQL Database Schema
-- Created: 2026-07-22

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types for status
CREATE TYPE upload_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'rejected',
    'archived'
);

CREATE TYPE batch_type AS ENUM (
    'batch_1',
    'batch_2',
    'batch_3'
);

-- Main B-Form uploads table
CREATE TABLE IF NOT EXISTS bform_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(50) NOT NULL,
    batch_type batch_type NOT NULL,
    year INTEGER NOT NULL,
    period VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    upload_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status upload_status NOT NULL DEFAULT 'pending',
    uploaded_by VARCHAR(100) NOT NULL,
    rejection_reason TEXT,
    number_of_forms INTEGER DEFAULT 0,
    checksum VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT bform_uploads_unique_upload UNIQUE (customer_id, year, period, deleted_at),
    CONSTRAINT bform_uploads_year_valid CHECK (year >= 2000 AND year <= 2100),
    CONSTRAINT bform_uploads_file_size_positive CHECK (file_size >= 0),
    CONSTRAINT bform_uploads_status_pending_no_rejection
        CHECK ((status != 'pending' OR rejection_reason IS NULL))
);

-- B-Form upload history table for audit trail
CREATE TABLE IF NOT EXISTS bform_upload_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID NOT NULL REFERENCES bform_uploads(id) ON DELETE CASCADE,
    previous_status upload_status,
    new_status upload_status NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    change_reason TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- B-Form upload summary table
CREATE TABLE IF NOT EXISTS bform_upload_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    period VARCHAR(20) NOT NULL,
    total_uploads INTEGER NOT NULL DEFAULT 0,
    completed_uploads INTEGER NOT NULL DEFAULT 0,
    pending_uploads INTEGER NOT NULL DEFAULT 0,
    processing_uploads INTEGER NOT NULL DEFAULT 0,
    rejected_uploads INTEGER NOT NULL DEFAULT 0,
    archived_uploads INTEGER NOT NULL DEFAULT 0,
    total_file_size BIGINT NOT NULL DEFAULT 0,
    total_forms INTEGER NOT NULL DEFAULT 0,
    last_upload_date TIMESTAMP WITH TIME ZONE,
    batch_completion_rate NUMERIC(5, 2),
    last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT bform_upload_summary_unique_period UNIQUE (year, period),
    CONSTRAINT bform_upload_summary_year_valid CHECK (year >= 2000 AND year <= 2100),
    CONSTRAINT bform_upload_summary_completion_rate_valid
        CHECK (batch_completion_rate IS NULL OR (batch_completion_rate >= 0 AND batch_completion_rate <= 100))
);

-- Customer/Society reference table
CREATE TABLE IF NOT EXISTS bform_societies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(50) NOT NULL UNIQUE,
    society_name VARCHAR(255) NOT NULL,
    batch_type batch_type NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    last_upload_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT bform_societies_status_valid CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- Create indexes for performance
CREATE INDEX idx_bform_uploads_customer_id ON bform_uploads(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bform_uploads_year ON bform_uploads(year) WHERE deleted_at IS NULL;
CREATE INDEX idx_bform_uploads_period ON bform_uploads(period) WHERE deleted_at IS NULL;
CREATE INDEX idx_bform_uploads_upload_date ON bform_uploads(upload_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_bform_uploads_status ON bform_uploads(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_bform_uploads_batch_type ON bform_uploads(batch_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_bform_uploads_year_period ON bform_uploads(year, period) WHERE deleted_at IS NULL;
CREATE INDEX idx_bform_uploads_customer_year_period ON bform_uploads(customer_id, year, period) WHERE deleted_at IS NULL;

CREATE INDEX idx_bform_upload_history_upload_id ON bform_upload_history(upload_id);
CREATE INDEX idx_bform_upload_history_changed_at ON bform_upload_history(changed_at);
CREATE INDEX idx_bform_upload_history_new_status ON bform_upload_history(new_status);

CREATE INDEX idx_bform_upload_summary_year ON bform_upload_summary(year);
CREATE INDEX idx_bform_upload_summary_period ON bform_upload_summary(period);
CREATE INDEX idx_bform_upload_summary_year_period ON bform_upload_summary(year, period);

CREATE INDEX idx_bform_societies_batch_type ON bform_societies(batch_type);
CREATE INDEX idx_bform_societies_status ON bform_societies(status);

-- Create comment documentation
COMMENT ON TABLE bform_uploads IS 'Main table for tracking B-Form uploads from societies';
COMMENT ON COLUMN bform_uploads.customer_id IS 'Society identifier (e.g., 168BF)';
COMMENT ON COLUMN bform_uploads.file_checksum IS 'SHA256 checksum for file integrity verification';
COMMENT ON TABLE bform_upload_history IS 'Audit trail for all status changes and modifications';
COMMENT ON TABLE bform_upload_summary IS 'Summary statistics by year and period';
COMMENT ON TABLE bform_societies IS 'Reference data for all societies';
