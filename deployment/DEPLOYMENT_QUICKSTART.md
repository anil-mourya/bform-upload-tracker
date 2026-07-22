# B-Form Upload Tracker - Railway Deployment Quick Start

## 5-Minute Setup

### Prerequisites
```bash
# Install Railway CLI
npm install -g @railway/cli

# Install Docker (for local testing)
# https://www.docker.com/products/docker-desktop
```

### Step 1: Initialize Railway Project (2 min)
```bash
# Navigate to project root
cd b-form-tracker

# Login to Railway
railway login

# Create new project
railway init
# Select "Create new project" and name it "b-form-tracker"
```

### Step 2: Add Services (2 min)
```bash
# Add PostgreSQL
railway add postgres

# Add Redis (optional but recommended)
railway add redis

# View generated services
railway status
```

### Step 3: Configure Environment (1 min)
```bash
# Set environment variables
railway set NODE_ENV=production
railway set JWT_SECRET=your-secure-random-string-here
railway set API_BASE_URL=https://your-domain.com

# Verify variables
railway variables
```

### Step 4: Deploy (1 min)
```bash
# Deploy services
railway up

# Monitor deployment
railway logs --follow

# Check service status
railway status
```

### Step 5: Setup Database (1 min)
```bash
# SSH into backend service
railway shell backend

# Run migrations
npm run migrate

# Exit shell
exit
```

### Verify Deployment
```bash
# Get service URLs
railway domain

# Test health endpoint
curl https://your-domain.com/health
```

## Common Commands

```bash
# View logs
railway logs --service backend
railway logs --service frontend

# Restart service
railway redeploy backend

# Stop service
railway stop backend

# Check resource usage
railway status

# View environment variables
railway variables

# Set new variable
railway set VARIABLE_NAME=value

# Add service
railway add postgres  # or redis, mysql, etc

# Remove service
railway remove postgres
```

## Troubleshooting

### Build Failed
```bash
# View detailed build logs
railway logs --service backend --since 24h

# Rebuild
railway up --force
```

### Database Connection Error
```bash
# Verify DATABASE_URL
railway variables | grep DATABASE_URL

# Test connection
railway shell backend --command "psql \$DATABASE_URL -c 'SELECT 1'"
```

### Frontend Can't Connect to Backend
```bash
# Check API URL
railway variables | grep API_BASE_URL

# Verify CORS is configured
# Check backend environment: CORS_ORIGIN
```

### Out of Memory
```bash
# Check current usage
railway status

# Increase memory via dashboard:
# Project Settings → Resources → Memory
```

## Next Steps

1. **Configure Custom Domain**
   - Project Dashboard → Settings → Domains
   - Add your domain and follow DNS setup

2. **Setup Monitoring**
   - Project Dashboard → Monitoring → Create Alert
   - Configure thresholds and notifications

3. **Enable Backups**
   ```bash
   # Backup database
   ./backup-database.sh production
   ```

4. **Setup CI/CD**
   - Copy `.github/workflows/railway-deploy.yml` to your repo
   - Add Railway secrets to GitHub
   - Push to main to auto-deploy

## Production Checklist

- [ ] Environment variables set securely
- [ ] Database backups scheduled
- [ ] SSL/TLS certificates valid
- [ ] Domain configured correctly
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Error tracking (Sentry) set up
- [ ] Logs aggregated and accessible
- [ ] Team has access to dashboard
- [ ] Rollback procedure tested

## Support

- Railway Docs: https://docs.railway.app
- Project Issues: Create GitHub issue
- Status Page: https://status.railway.app
