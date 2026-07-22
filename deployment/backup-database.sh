#!/bin/bash

##############################################################################
# B-Form Upload Tracker - Database Backup Script
# Usage: ./backup-database.sh [environment]
# Environments: development, staging, production
##############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/bform_db_${ENVIRONMENT}_${DATE}.sql"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Environment-specific configuration
case $ENVIRONMENT in
  production)
    DB_HOST="${DB_HOST:-postgres.railway.internal}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-bform_db}"
    DB_USER="${DB_USER:-bform_user}"
    RETENTION_DAYS=30
    ;;
  staging)
    DB_HOST="${STAGING_DB_HOST:-postgres.railway.internal}"
    DB_PORT="${STAGING_DB_PORT:-5432}"
    DB_NAME="${STAGING_DB_NAME:-bform_db_staging}"
    DB_USER="${STAGING_DB_USER:-bform_user}"
    RETENTION_DAYS=14
    ;;
  development)
    DB_HOST="${DEV_DB_HOST:-localhost}"
    DB_PORT="${DEV_DB_PORT:-5432}"
    DB_NAME="${DEV_DB_NAME:-bform_db}"
    DB_USER="${DEV_DB_USER:-postgres}"
    RETENTION_DAYS=7
    ;;
  *)
    echo -e "${RED}Error: Unknown environment '${ENVIRONMENT}'${NC}"
    echo "Usage: ./backup-database.sh [development|staging|production]"
    exit 1
    ;;
esac

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to log messages
log_message() {
  local level=$1
  local message=$2
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[${timestamp}] [${level}] ${message}" | tee -a "$LOG_FILE"
}

# Function to check if database is accessible
check_database() {
  log_message "INFO" "Checking database connection..."

  if ! PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "\q" 2>/dev/null; then
    log_message "ERROR" "Cannot connect to database at ${DB_HOST}:${DB_PORT}"
    return 1
  fi

  log_message "INFO" "Database connection successful"
  return 0
}

# Function to create backup
create_backup() {
  log_message "INFO" "Creating backup of ${ENVIRONMENT} database..."
  log_message "INFO" "Database: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
  log_message "INFO" "Backup file: ${BACKUP_FILE}"

  if PGPASSWORD="$DB_PASSWORD" pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --format=plain \
    --verbose \
    --no-password \
    > "$BACKUP_FILE" 2>&1; then
    log_message "INFO" "Backup created successfully"

    # Get file size
    local file_size=$(du -h "$BACKUP_FILE" | cut -f1)
    log_message "INFO" "Backup size: ${file_size}"

    return 0
  else
    log_message "ERROR" "Backup failed"
    rm -f "$BACKUP_FILE"
    return 1
  fi
}

# Function to compress backup
compress_backup() {
  log_message "INFO" "Compressing backup..."

  if gzip -v "$BACKUP_FILE" 2>&1 | tee -a "$LOG_FILE"; then
    BACKUP_FILE="${BACKUP_FILE}.gz"
    local file_size=$(du -h "$BACKUP_FILE" | cut -f1)
    log_message "INFO" "Backup compressed successfully"
    log_message "INFO" "Compressed size: ${file_size}"
    return 0
  else
    log_message "ERROR" "Compression failed"
    return 1
  fi
}

# Function to upload to S3 (optional)
upload_to_s3() {
  if command -v aws &> /dev/null && [ -n "$AWS_S3_BUCKET" ]; then
    log_message "INFO" "Uploading backup to S3..."

    if aws s3 cp "$BACKUP_FILE" "s3://${AWS_S3_BUCKET}/backups/bform/${ENVIRONMENT}/" \
      --sse AES256 \
      --metadata "environment=${ENVIRONMENT},date=${DATE}" 2>&1 | tee -a "$LOG_FILE"; then
      log_message "INFO" "Backup uploaded to S3 successfully"
      return 0
    else
      log_message "ERROR" "S3 upload failed"
      return 1
    fi
  fi
  return 0
}

# Function to cleanup old backups
cleanup_old_backups() {
  log_message "INFO" "Cleaning up backups older than ${RETENTION_DAYS} days..."

  find "$BACKUP_DIR" \
    -name "bform_db_${ENVIRONMENT}_*.sql*" \
    -mtime +${RETENTION_DAYS} \
    -delete \
    -print | while read file; do
    log_message "INFO" "Deleted old backup: ${file}"
  done

  log_message "INFO" "Cleanup completed"
}

# Function to verify backup
verify_backup() {
  log_message "INFO" "Verifying backup integrity..."

  if [[ "$BACKUP_FILE" == *.gz ]]; then
    if gzip -t "$BACKUP_FILE" 2>&1 | tee -a "$LOG_FILE"; then
      log_message "INFO" "Backup integrity verified successfully"
      return 0
    else
      log_message "ERROR" "Backup integrity check failed"
      return 1
    fi
  else
    # For uncompressed files, check if they're readable
    if head -n 5 "$BACKUP_FILE" | grep -q "PostgreSQL"; then
      log_message "INFO" "Backup integrity verified successfully"
      return 0
    else
      log_message "ERROR" "Backup integrity check failed"
      return 1
    fi
  fi
}

# Main execution
main() {
  echo -e "${GREEN}========================================${NC}"
  echo "B-Form Upload Tracker - Database Backup"
  echo "Environment: ${ENVIRONMENT}"
  echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
  echo -e "${GREEN}========================================${NC}"
  echo ""

  log_message "INFO" "Starting backup process for ${ENVIRONMENT}"

  # Execute backup steps
  if ! check_database; then
    log_message "ERROR" "Backup cancelled due to database connection failure"
    exit 1
  fi

  if ! create_backup; then
    log_message "ERROR" "Backup creation failed"
    exit 1
  fi

  if ! compress_backup; then
    log_message "ERROR" "Compression failed"
    exit 1
  fi

  if ! verify_backup; then
    log_message "ERROR" "Backup verification failed"
    exit 1
  fi

  if ! upload_to_s3; then
    log_message "WARN" "S3 upload skipped or failed, but backup is available locally"
  fi

  cleanup_old_backups

  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo "Backup completed successfully!"
  echo "Location: ${BACKUP_FILE}"
  echo -e "${GREEN}========================================${NC}"

  log_message "INFO" "Backup process completed successfully"
}

# Execute main function
main "$@"
