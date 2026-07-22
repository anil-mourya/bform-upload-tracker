#!/bin/bash

##############################################################################
# B-Form Upload Tracker - Railway Automated Setup Script
# This script automates the initial Railway deployment setup
##############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
  print_header "Checking Prerequisites"

  # Check if Railway CLI is installed
  if command -v railway &> /dev/null; then
    print_success "Railway CLI is installed"
  else
    print_error "Railway CLI not found"
    echo "Install with: npm install -g @railway/cli"
    exit 1
  fi

  # Check if Node.js is installed
  if command -v node &> /dev/null; then
    local node_version=$(node -v)
    print_success "Node.js is installed ($node_version)"
  else
    print_error "Node.js not found"
    exit 1
  fi

  # Check if Git is installed
  if command -v git &> /dev/null; then
    print_success "Git is installed"
  else
    print_error "Git not found"
    exit 1
  fi

  # Check if Docker is installed (optional)
  if command -v docker &> /dev/null; then
    print_success "Docker is installed (optional but recommended)"
  else
    print_warning "Docker not found (optional for local testing)"
  fi

  # Check if in git repository
  if [ -d .git ]; then
    print_success "Git repository detected"
  else
    print_warning "Not in a Git repository - Railway will need GitHub integration"
  fi
}

# Interactive configuration
configure_environment() {
  print_header "Environment Configuration"

  # Get project name
  read -p "Enter Railway project name (default: b-form-tracker): " project_name
  project_name=${project_name:-b-form-tracker}

  # Get environment
  read -p "Select environment (production/staging/development): " environment
  environment=${environment:-production}

  # Get domain
  read -p "Enter your domain (e.g., yourdomain.com): " domain

  # Get JWT secret
  print_info "Generating JWT secret..."
  jwt_secret=$(openssl rand -base64 32)
  print_success "JWT secret generated"

  # Get email for notifications
  read -p "Enter email for alerts (optional): " alert_email

  echo ""
  echo "Configuration Summary:"
  echo "  Project Name: $project_name"
  echo "  Environment: $environment"
  echo "  Domain: $domain"
  echo "  JWT Secret: [generated]"
  echo "  Alert Email: ${alert_email:-[not set]}"
  echo ""

  read -p "Is this correct? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    print_warning "Configuration cancelled"
    exit 1
  fi
}

# Initialize Railway project
init_railway() {
  print_header "Initializing Railway Project"

  # Check if already logged in
  if [ ! -f ~/.railway/config.json ]; then
    print_info "Not logged into Railway"
    read -p "Open browser to login? (yes/no): " do_login
    if [ "$do_login" = "yes" ]; then
      railway login
    fi
  else
    print_success "Already logged into Railway"
  fi

  # Initialize project
  if railway init --name "$project_name"; then
    print_success "Railway project initialized"
  else
    print_error "Failed to initialize Railway project"
    print_info "Run: railway init --name $project_name"
    exit 1
  fi
}

# Add services
add_services() {
  print_header "Adding Services"

  # PostgreSQL
  print_info "Adding PostgreSQL..."
  if railway add postgres; then
    print_success "PostgreSQL added"
  else
    print_warning "PostgreSQL already exists or failed to add"
  fi

  # Redis (optional)
  read -p "Add Redis service? (yes/no): " add_redis
  if [ "$add_redis" = "yes" ]; then
    print_info "Adding Redis..."
    if railway add redis; then
      print_success "Redis added"
    else
      print_warning "Redis already exists or failed to add"
    fi
  fi

  print_success "Services added"
}

# Configure environment variables
set_variables() {
  print_header "Setting Environment Variables"

  print_info "Setting production environment variables..."

  # Core configuration
  railway set NODE_ENV="$environment"
  railway set PORT=5000
  railway set LOG_LEVEL=info
  railway set API_BASE_URL="https://$domain"
  railway set CORS_ORIGIN="https://$domain"

  # Security
  railway set JWT_SECRET="$jwt_secret"
  railway set JWT_EXPIRY=7d

  # Email notifications
  if [ -n "$alert_email" ]; then
    railway set ALERT_EMAIL="$alert_email"
  fi

  print_success "Environment variables set"

  print_warning "Important: Verify and update the following in Railway dashboard:"
  print_warning "  - DATABASE_PASSWORD (generated by PostgreSQL plugin)"
  print_warning "  - SMTP credentials (for email notifications)"
  print_warning "  - Any third-party API keys (Sentry, S3, etc.)"
}

# Build and deploy
deploy_services() {
  print_header "Building and Deploying Services"

  print_info "This may take several minutes..."
  print_info "You can monitor progress at: https://railway.app"

  if railway up; then
    print_success "Services deployed successfully"
  else
    print_error "Deployment failed"
    print_info "Check logs with: railway logs --follow"
    exit 1
  fi
}

# Wait for services to be ready
wait_for_services() {
  print_header "Waiting for Services to Start"

  local max_attempts=30
  local attempt=0

  while [ $attempt -lt $max_attempts ]; do
    print_info "Checking service status... (Attempt $((attempt + 1))/$max_attempts)"

    if railway status 2>/dev/null | grep -q "running"; then
      print_success "Services are running"
      return 0
    fi

    attempt=$((attempt + 1))
    sleep 10
  done

  print_warning "Services took longer to start - they may still be starting"
  print_info "Check status with: railway status"
  print_info "View logs with: railway logs --follow"
}

# Run database migrations
run_migrations() {
  print_header "Running Database Migrations"

  print_info "Connecting to backend service..."

  if railway shell backend --command "npm run migrate"; then
    print_success "Database migrations completed"
  else
    print_error "Migration failed"
    print_info "Run manually with: railway shell backend --command 'npm run migrate'"
  fi
}

# Configure domain
configure_domain() {
  print_header "Configuring Domain"

  print_info "Railway has assigned a temporary domain"
  print_info "To use your custom domain ($domain):"
  echo ""
  echo "1. Go to Railway Dashboard → Project Settings → Domains"
  echo "2. Click 'Add Domain'"
  echo "3. Enter your domain: $domain"
  echo "4. Update your DNS records according to Railway's instructions"
  echo "5. Wait for DNS propagation (typically 5-30 minutes)"
  echo ""
  print_info "After DNS is set up, your app will be available at https://$domain"
}

# Health check
perform_health_check() {
  print_header "Health Check"

  # Get Railway-assigned domain
  print_info "Checking service health..."

  sleep 5

  # Try health check
  if railway shell backend --command "curl -f http://localhost:5000/health" 2>/dev/null; then
    print_success "Backend is healthy"
  else
    print_warning "Could not verify backend health"
    print_info "Check with: railway shell backend --command 'curl http://localhost:5000/health'"
  fi
}

# Setup GitHub CI/CD
setup_github_cicd() {
  print_header "GitHub CI/CD Setup"

  read -p "Setup GitHub Actions for CI/CD? (yes/no): " setup_cicd

  if [ "$setup_cicd" = "yes" ]; then
    print_info "You need to:"
    echo ""
    echo "1. Copy .github/workflows/railway-deploy.yml to your repo"
    echo "2. Add GitHub secrets:"
    echo "   - RAILWAY_TOKEN: $(railway token 2>/dev/null || echo '[run: railway token]')"
    echo "   - RAILWAY_PROJECT_ID: [from Railway dashboard]"
    echo "   - RAILWAY_ENVIRONMENT_ID: [from Railway dashboard]"
    echo "   - SLACK_WEBHOOK_URL: [optional, for notifications]"
    echo ""
    echo "3. Commit and push the workflow file"
    echo ""
    print_info "After setup, every push to main will auto-deploy"
  fi
}

# Show summary
show_summary() {
  print_header "Deployment Complete!"

  echo ""
  echo "Your B-Form Upload Tracker is now deployed!"
  echo ""
  echo "Next steps:"
  echo "  1. Configure your domain ($domain)"
  echo "  2. Set up monitoring alerts"
  echo "  3. Configure backups"
  echo "  4. Setup GitHub CI/CD for auto-deployment"
  echo ""
  echo "Useful commands:"
  echo "  railway status              - Show service status"
  echo "  railway logs --follow       - View live logs"
  echo "  railway shell backend       - SSH into backend"
  echo "  railway variables           - View environment variables"
  echo "  railway domains             - Show assigned domains"
  echo ""
  echo "Dashboard: https://railway.app"
  echo ""
}

# Main execution
main() {
  print_header "B-Form Upload Tracker - Railway Setup"

  check_prerequisites
  configure_environment
  init_railway
  add_services
  set_variables
  deploy_services
  wait_for_services
  run_migrations
  perform_health_check
  configure_domain
  setup_github_cicd
  show_summary
}

# Run main function
main "$@"
