# B-Form Upload Tracker - Railway Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Pre-Deployment Setup](#pre-deployment-setup)
4. [Railway Configuration](#railway-configuration)
5. [Database Setup](#database-setup)
6. [Deployment Steps](#deployment-steps)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Post-Deployment](#post-deployment)
9. [Monitoring & Logging](#monitoring--logging)
10. [Troubleshooting](#troubleshooting)
11. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required Tools
- **Railway CLI**: `npm install -g @railway/cli`
- **Node.js**: v18+ (for local testing)
- **Docker**: v20.10+ (optional but recommended)
- **Git**: Latest version
- **PostgreSQL Client**: For local testing

### Account Setup
1. Create Railway account at https://railway.app
2. Connect GitHub account to Railway
3. Generate Railway API token (Settings → Tokens)
4. Install Railway CLI: `railway login`

### GitHub Repository
- Ensure repository is public or Railway has access
- Confirm main/master branch exists
- Add deployment branch protection if needed

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Railway Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │   Frontend       │      │   Backend API    │            │
│  │   (React/Next)   │      │   (Node.js)      │            │
│  │   Port: 3000     │      │   Port: 5000     │            │
│  └────────┬─────────┘      └────────┬─────────┘            │
│           │                         │                      │
│           └─────────────┬───────────┘                      │
│                         │                                 │
│                   ┌─────▼──────┐                          │
│                   │ PostgreSQL  │                          │
│                   │ Database    │                          │
│                   └─────────────┘                          │
│                                                              │
│           Environment: Production/Staging                   │
│           Region: US/EU (configurable)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Pre-Deployment Setup

### 1. Prepare Repository Structure

```
b-form-tracker/
├── backend/
│   ├── src/
│   ├── migrations/
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── Procfile
├── railway.json
├── .railway/
│   └── config.toml
└── README.md
```

### 2. Environment Variables Setup

Create `.env.example` files for both backend and frontend:

**Backend (.env.example):**
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/bform_db
JWT_SECRET=your-secret-key-here
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
API_BASE_URL=https://api.yourdomain.com
```

**Frontend (.env.example):**
```
REACT_APP_API_BASE_URL=https://api.yourdomain.com
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0
```

### 3. Verify Build Scripts

Ensure `package.json` includes:

**Backend:**
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "migrate": "node scripts/migrate.js"
  }
}
```

**Frontend:**
```json
{
  "scripts": {
    "build": "react-scripts build",
    "start": "serve -s build -l 3000",
    "dev": "react-scripts start"
  }
}
```

---

## Railway Configuration

### 1. Create railway.json

Location: `/railway.json` (root directory)

```json
{
  "$schema": "https://railway.app/schema/railway.schema.json",
  "services": {
    "backend": {
      "source": "backend",
      "builder": "nixpacks",
      "runtime": "nodejs",
      "rootDirectory": "backend",
      "buildCommand": "npm install && npm run build",
      "startCommand": "npm start",
      "variables": {
        "NODE_ENV": "production",
        "PORT": "5000"
      }
    },
    "frontend": {
      "source": "frontend",
      "builder": "nixpacks",
      "runtime": "nodejs",
      "rootDirectory": "frontend",
      "buildCommand": "npm install && npm run build",
      "startCommand": "npm start",
      "variables": {
        "NODE_ENV": "production",
        "PORT": "3000"
      }
    }
  }
}
```

### 2. Create Procfile

Location: `/Procfile`

```
web: npm --prefix backend start
api: npm --prefix backend start
frontend: npm --prefix frontend start
```

### 3. Create .railway/config.toml

Location: `/.railway/config.toml`

```toml
[build]
# Build configuration
builder = "nixpacks"

[deploy]
# Deployment settings
startCommand = "npm start"
buildCommand = "npm install && npm run build"

[environment]
# Environment-specific settings
PORT = "5000"
NODE_ENV = "production"

[services]
[services.postgres]
image = "postgres:15"
version = "15"

[services.redis]
image = "redis:7"
version = "7"
```

---

## Database Setup

### 1. PostgreSQL Connection String

Format: `postgresql://username:password@host:port/database`

Example:
```
postgresql://bform_user:SecurePassword123@postgres.railway.internal:5432/bform_db
```

### 2. Run on Railway

```bash
# Login to Railway
railway login

# Link to your Railway project
railway link

# Add PostgreSQL plugin
railway add postgres

# View connection details
railway variables
```

### 3. Database Migration Scripts

**File: `backend/scripts/migrate.js`**

```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

const migrationsDir = path.join(__dirname, '../migrations');

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    // Create migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Read migration files
    const files = fs.readdirSync(migrationsDir).sort();
    
    for (const file of files) {
      const { rows } = await client.query(
        'SELECT * FROM migrations WHERE name = $1',
        [file]
      );

      if (rows.length === 0) {
        const migration = fs.readFileSync(
          path.join(migrationsDir, file),
          'utf8'
        );
        
        console.log(`Running migration: ${file}`);
        await client.query(migration);
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        console.log(`✓ ${file} completed`);
      }
    }

    console.log('All migrations completed!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigrations().catch(process.exit);
```

### 4. Initial Migration

**File: `backend/migrations/001_init_schema.sql`**

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create b_forms table
CREATE TABLE IF NOT EXISTS b_forms (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  equipment_name VARCHAR(255) NOT NULL,
  serial_number VARCHAR(255),
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  installation_date DATE,
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  document_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id SERIAL PRIMARY KEY,
  b_form_id INTEGER REFERENCES b_forms(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  renewal_date DATE,
  document_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id INTEGER,
  changes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_b_forms_user_id ON b_forms(user_id);
CREATE INDEX idx_b_forms_status ON b_forms(status);
CREATE INDEX idx_form_submissions_b_form_id ON form_submissions(b_form_id);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## Deployment Steps

### Step 1: Prepare Your Repository

```bash
# Clone repository
git clone https://github.com/yourusername/b-form-tracker.git
cd b-form-tracker

# Create and configure .env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Update environment variables
nano backend/.env
nano frontend/.env
```

### Step 2: Initialize Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
# Follow prompts to name your project

# Or link to existing project
railway link
```

### Step 3: Add Services

```bash
# Add PostgreSQL database
railway add postgres

# View Railway variables
railway variables

# Set custom environment variables
railway set NODE_ENV=production
railway set JWT_SECRET=your-secret-key-here
railway set API_BASE_URL=https://yourdomain.com
```

### Step 4: Configure Domains

```bash
# View generated domain
railway domains

# Add custom domain (optional)
railway domain add yourdomain.com

# Connect to DNS provider (see Railway dashboard)
```

### Step 5: Deploy

```bash
# Using Railway CLI
railway up

# Or push to GitHub and let Railway auto-deploy
git add .
git commit -m "Add Railway configuration"
git push origin main

# Monitor deployment
railway logs

# View running services
railway status
```

### Step 6: Run Database Migrations

```bash
# SSH into backend service
railway shell backend

# Run migrations
npm run migrate

# Verify database
psql $DATABASE_URL -c "\dt"

# Exit
exit
```

### Step 7: Verify Deployment

```bash
# Check health endpoints
curl https://api.yourdomain.com/health
curl https://yourdomain.com/health

# View logs
railway logs --service backend
railway logs --service frontend

# Check services status
railway status
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

**File: `.github/workflows/railway-deploy.yml`**

```yaml
name: Railway Deploy

on:
  push:
    branches:
      - main
      - staging
  pull_request:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies (Backend)
        run: npm ci --prefix backend

      - name: Install dependencies (Frontend)
        run: npm ci --prefix frontend

      - name: Lint Backend
        run: npm run lint --prefix backend

      - name: Lint Frontend
        run: npm run lint --prefix frontend

      - name: Test Backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        run: npm test --prefix backend

      - name: Test Frontend
        run: npm test --prefix frontend -- --coverage --watchAll=false

      - name: Build Backend
        run: npm run build --prefix backend

      - name: Build Frontend
        run: npm run build --prefix frontend

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging')

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm install -g @railway/cli
          railway link --projectId ${{ secrets.RAILWAY_PROJECT_ID }} --environmentId ${{ secrets.RAILWAY_ENVIRONMENT_ID }}
          railway up

      - name: Run Migrations
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          railway shell backend --command "npm run migrate"

      - name: Health Check
        run: |
          sleep 30
          curl -f https://api.yourdomain.com/health || exit 1
          curl -f https://yourdomain.com/health || exit 1

      - name: Notify Slack
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Deployment ${{ job.status }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "B-Form Tracker Deployment\nStatus: ${{ job.status }}\nBranch: ${{ github.ref_name }}\nCommit: ${{ github.sha }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Post-Deployment

### 1. Health Checks

**Create: `backend/src/routes/health.ts`**

```typescript
import express from 'express';
import { Pool } from 'pg';

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const result = await pool.query('SELECT 1');
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/health/deep', async (req, res) => {
  const checks = {
    api: false,
    database: false,
    redis: false
  };

  // API check
  checks.api = true;

  // Database check
  try {
    await pool.query('SELECT 1');
    checks.database = true;
  } catch (error) {
    checks.database = false;
  }

  const allHealthy = Object.values(checks).every(v => v);

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  });
});

export default router;
```

### 2. Monitoring Setup

**File: `.railway/monitoring.toml`**

```toml
[alerts]
enabled = true

[[alerts.rules]]
name = "High Memory Usage"
metric = "memory_usage_percent"
threshold = 85
duration = "5m"
action = "notify"

[[alerts.rules]]
name = "High CPU Usage"
metric = "cpu_usage_percent"
threshold = 80
duration = "5m"
action = "notify"

[[alerts.rules]]
name = "Database Connection Failed"
metric = "database_connections"
threshold = 0
duration = "1m"
action = "page"

[[alerts.rules]]
name = "High Error Rate"
metric = "error_rate_percent"
threshold = 5
duration = "5m"
action = "notify"
```

### 3. Configure Sentry (Error Tracking)

**Install Sentry:**

```bash
# Backend
npm install --save @sentry/node

# Frontend
npm install --save @sentry/react
```

**Backend Integration:**

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Frontend Integration:**

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

---

## Monitoring & Logging

### 1. View Logs

```bash
# All services
railway logs

# Specific service
railway logs --service backend
railway logs --service frontend

# Follow logs
railway logs --follow

# Filter by level
railway logs --service backend | grep ERROR
```

### 2. Railway Dashboard

1. Open https://railway.app/dashboard
2. Select your project
3. Click on service (backend/frontend)
4. View logs, metrics, and deployments

### 3. Set Up Log Aggregation

**File: `backend/src/logger.ts`**

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'b-form-tracker-backend',
    environment: process.env.NODE_ENV 
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

export default logger;
```

### 4. Performance Monitoring

```bash
# Check resource usage
railway status

# View metrics in dashboard
# Settings → Monitoring → View Metrics

# Check uptime
railway logs --since 24h | grep "error\|warn" | wc -l
```

---

## Troubleshooting

### Issue: Deployment Fails

**Solution:**
```bash
# Check build logs
railway logs --service backend

# Verify environment variables
railway variables

# Check disk space
railway shell backend --command "df -h"

# Rebuild and redeploy
railway up --force
```

### Issue: Database Connection Error

**Solution:**
```bash
# Verify DATABASE_URL
railway variables | grep DATABASE_URL

# Test connection
railway shell backend --command "psql \$DATABASE_URL -c '\dt'"

# Check PostgreSQL service
railway status | grep postgres
```

### Issue: Frontend Can't Reach Backend API

**Solution:**
```bash
# Check CORS configuration
railway variables | grep API_BASE_URL

# Verify backend is running
curl -I https://api.yourdomain.com/health

# Check frontend environment variables
railway shell frontend --command "env | grep REACT_APP"
```

### Issue: Out of Memory

**Solution:**
```bash
# Check current memory usage
railway status

# Increase RAM (via Railway dashboard)
# Settings → Resources → Increase Memory

# Check for memory leaks
railway logs --service backend | grep "FATAL"
```

### Issue: Slow Performance

**Solution:**
```bash
# Add database indexes
railway shell backend --command "npm run migrate"

# Check slow queries
railway shell backend --command "psql \$DATABASE_URL -c 'SELECT * FROM pg_stat_statements LIMIT 10;'"

# Increase CPU
# Settings → Resources → Increase vCPU
```

---

## Rollback Procedures

### 1. Rollback Recent Deployment

```bash
# View deployment history
railway deployments

# Rollback to previous version
railway redeploy <deployment-id>

# Verify rollback
railway logs
railway status
```

### 2. Database Rollback

```bash
# SSH into backend
railway shell backend

# List migrations
psql $DATABASE_URL -c "SELECT * FROM migrations ORDER BY executed_at DESC LIMIT 5;"

# Restore from backup (if needed)
psql $DATABASE_URL < backup.sql

# Re-run migrations if needed
npm run migrate
```

### 3. Emergency Rollback

```bash
# Stop current deployment
railway stop backend
railway stop frontend

# Switch to stable branch
git checkout stable

# Redeploy
railway up

# Monitor
railway logs --follow
```

### 4. Database Backup Before Deployment

```bash
# Create backup
railway shell backend --command "pg_dump \$DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql"

# List backups
railway shell backend --command "ls -la *.sql"

# Restore from backup
railway shell backend --command "psql \$DATABASE_URL < backup-20240722-120000.sql"
```

---

## Post-Deployment Checklist

- [ ] Database migrations completed successfully
- [ ] Both frontend and backend services running
- [ ] Health check endpoints responding
- [ ] API endpoints accessible
- [ ] Frontend loads and connects to backend
- [ ] Logging configured and working
- [ ] Monitoring alerts set up
- [ ] Sentry error tracking configured
- [ ] Database backups enabled
- [ ] SSL/TLS certificates valid
- [ ] Domain names configured
- [ ] GitHub Actions pipeline working
- [ ] Rollback procedure documented
- [ ] Team notified of deployment
- [ ] User documentation updated

---

## Support & Resources

- Railway Documentation: https://docs.railway.app
- Railway CLI: https://docs.railway.app/cli/overview
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Node.js Best Practices: https://nodejs.org/en/docs/guides/

For issues or questions, contact the DevOps team or Railway support.
