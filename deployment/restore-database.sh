#!/bin/bash

##############################################################################
# B-Form Upload Tracker - Database Restore Script
# Usage: ./restore-database.sh <backup-file> [environment]
# Example: ./restore-database.sh backups/bform_db_production_20240722_120000.sql.gz production
##############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parameters
BACKUP_FILE="$1"
ENVIRONMENT="${2:-production}"
LOG_FILE="./restore.log"

# Environment-specific configuration
case $ENVIRONMENT in
  production)
    DB_HOST="${DB_HOST:-postgres.railway.internal}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-bform_db}"
    DB_USER="${DB_USER:-bform_user}"
    ;;
  staging)
    DB_HOST="${STAGING_DB_HOST:-postgres.railway.internal}"
    DB_PORT="${STAGING_DB_PORT:-5432}"
    DB_NAME="${STAGING_DB_NAME:-bform_db_staging}"
    DB_USER="${STAGING_DB_USER:-bform_user}"
    ;;
  development)
    DB_HOST="${DEV_DB_HOST:-localhost}"
    DB_PORT="${DEV_DB_PORT:-5432}"
    DB_NAME="${DEV_DB_NAME:-bform_db}"
    DB_USER="${DEV_DB_USER:-postgres}"
    ;;
  *)
    echo -e "${RED}Error: Unknown environment '${ENVIRONMENT}'${NC}"
    echo "Usage: ./restore-database.sh <backup-file> [development|staging|production]"
    exit 1
    ;;
esac

# Function to log messages
log_message() {
  local level=$1
  local message=$2
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[${timestamp}] [${level}] ${message}" | tee -a "$LOG_FILE"
}

# Validate parameters
validate_params() {
  echo -e "${YELLOW}Validating parameters...${NC}"

  if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not specified${NC}"
    echo "Usage: ./restore-database.sh <backup-file> [environment]"
    exit 1
  fi

  if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
  fi

  log_message "INFO" "Backup file: ${BACKUP_FILE}"
  log_message "INFO" "Environment: ${ENVIRONMENT}"
  log_message "INFO" "Database: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
}

# Check database connectivity
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

# Confirm with user
confirm_restore() {
  echo ""
  echo -e "${YELLOW}========================================${NC}"
  echo "IMPORTANT: This will restore the database to: ${BACKUP_FILE}"
  echo "Environment: ${ENVIRONMENT}"
  echo "Database: ${DB_NAME}"
  echo ""
  echo -e "${RED}This action cannot be undone!${NC}"
  echo -e "${YELLOW}========================================${NC}"
  echo ""

  read -p "Are you sure you want to proceed? (yes/no): " confirmation

  if [ "$confirmation" != "yes" ]; then
    log_message "INFO" "Restore cancelled by user"
    echo -e "${YELLOW}Restore cancelled${NC}"
    exit 0
  fi
}

# Backup current database before restore
backup_current() {
  log_message "INFO" "Creating backup of current database before restore..."

  local current_backup="./backups/bform_db_${ENVIRONMENT}_pre_restore_$(date +%Y%m%d_%H%M%S).sql"
  mkdir -p "./backups"

  if PGPASSWORD="$DB_PASSWORD" pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    > "$current_backup" 2>&1; then
    log_message "INFO" "Pre-restore backup created: ${current_backup}"
  else
    log_message "WARN" "Could not create pre-restore backup"
  fi
}

# Drop and recreate database
prepare_database() {
  log_message "INFO" "Preparing database for restore..."

  # Connect to postgres database to drop the target database
  if PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "postgres" \
    -c "DROP DATABASE IF EXISTS \"${DB_NAME}\" WITH (FORCE);" 2>&1 | tee -a "$LOG_FILE"; then
    log_message "INFO" "Dropped existing database"
  else
    log_message "ERROR" "Failed to drop existing database"
    return 1
  fi

  # Recreate database
  if PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "postgres" \
    -c "CREATE DATABASE \"${DB_NAME}\" WITH ENCODING 'UTF8' LOCALE 'en_US.UTF-8';" 2>&1 | tee -a "$LOG_FILE"; then
    log_message "INFO" "Created new database"
    return 0
  else
    log_message "ERROR" "Failed to create database"
    return 1
  fi
}

# Perform restore
perform_restore() {
  log_message "INFO" "Starting database restore..."

  local temp_file="$BACKUP_FILE"

  # Decompress if needed
  if [[ "$BACKUP_FILE" == *.gz ]]; then
    log_message "INFO" "Decompressing backup file..."
    temp_file="${BACKUP_FILE%.gz}"

    if ! gunzip -c "$BACKUP_FILE" > "$temp_file"; then
      log_message "ERROR" "Failed to decompress backup file"
      return 1
    fi
  fi

  # Restore database
  if PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    < "$temp_file" 2>&1 | tee -a "$LOG_FILE"; then
    log_message "INFO" "Database restore completed successfully"

    # Clean up temp file if we decompressed
    if [[ "$BACKUP_FILE" == *.gz ]]; then
      rm -f "$temp_file"
    fi

    return 0
  else
    log_message "ERROR" "Database restore failed"
    return 1
  fi
}

# Verify restore
verify_restore() {
  log_message "INFO" "Verifying database restore..."

  if PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1 | tee -a "$LOG_FILE"; then
    log_message "INFO" "Database verify successful"
    return 0
  else
    log_message "ERROR" "Database verify failed"
    return 1
  fi
}

# Main execution
main() {
  echo -e "${GREEN}========================================${NC}"
  echo "B-Form Upload Tracker - Database Restore"
  echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
  echo -e "${GREEN}========================================${NC}"
  echo ""

  log_message "INFO" "Starting restore process"

  # Execute restore steps
  validate_params
  check_database
  confirm_restore
  backup_current

  if ! prepare_database; then
    log_message "ERROR" "Failed to prepare database"
    exit 1
  fi

  if ! perform_restore; then
    log_message "ERROR" "Restore failed"
    exit 1
  fi

  if ! verify_restore; then
    log_message "WARN" "Restore verification encountered issues, but restore may still have succeeded"
  fi

  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo "Restore completed successfully!"
  echo "Database: ${DB_NAME}"
  echo "Environment: ${ENVIRONMENT}"
  echo -e "${GREEN}========================================${NC}"

  log_message "INFO" "Restore process completed successfully"
}

# Execute main function
main "$@"
