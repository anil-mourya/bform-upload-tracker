# B-Form Upload Tracker - Environment Variables Documentation

## Overview

This document describes all environment variables used by the B-Form Upload Tracker application. Each service has its own configuration requirements.

## Backend Environment Variables

### Core Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NODE_ENV` | String | Yes | `development` | Runtime environment: `development`, `staging`, `production` |
| `PORT` | Number | No | `5000` | Port for backend API server |
| `LOG_LEVEL` | String | No | `info` | Logging level: `debug`, `info`, `warn`, `error` |

### Database Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `DATABASE_URL` | String | Yes | - | PostgreSQL connection string: `postgresql://user:pass@host:port/db` |
| `DB_HOST` | String | No | - | Database host (used if DATABASE_URL not set) |
| `DB_PORT` | Number | No | `5432` | Database port (used if DATABASE_URL not set) |
| `DB_NAME` | String | No | - | Database name (used if DATABASE_URL not set) |
| `DB_USER` | String | No | - | Database user (used if DATABASE_URL not set) |
| `DB_PASSWORD` | String | No | - | Database password (used if DATABASE_URL not set) |

### Redis Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REDIS_URL` | String | No | - | Redis connection string: `redis://[:password]@host:port` |
| `REDIS_HOST` | String | No | `localhost` | Redis host (used if REDIS_URL not set) |
| `REDIS_PORT` | Number | No | `6379` | Redis port (used if REDIS_URL not set) |
| `REDIS_PASSWORD` | String | No | - | Redis password (used if REDIS_URL not set) |

### Security Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `JWT_SECRET` | String | Yes | - | Secret key for JWT token signing (minimum 32 characters) |
| `JWT_EXPIRY` | String | No | `7d` | JWT token expiration time |
| `BCRYPT_ROUNDS` | Number | No | `10` | Password hashing rounds |
| `SESSION_SECRET` | String | Yes | - | Secret key for session encryption |
| `SESSION_TIMEOUT` | Number | No | `3600` | Session timeout in seconds (default 1 hour) |
| `SESSION_COOKIE_SECURE` | Boolean | No | `true` | Use secure cookies (HTTPS only) |
| `SESSION_COOKIE_HTTP_ONLY` | Boolean | No | `true` | Prevent JavaScript access to cookies |

### API Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `API_BASE_URL` | String | Yes | - | Public API URL (e.g., `https://api.yourdomain.com`) |
| `CORS_ORIGIN` | String | No | - | CORS allowed origins (comma-separated) |
| `API_RATE_LIMIT` | Number | No | `100` | API rate limit (requests per minute) |

### Email Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `SMTP_HOST` | String | No | - | SMTP server hostname |
| `SMTP_PORT` | Number | No | `587` | SMTP server port |
| `SMTP_USER` | String | No | - | SMTP authentication username |
| `SMTP_PASSWORD` | String | No | - | SMTP authentication password |
| `SMTP_FROM` | String | No | - | Email sender address |
| `SMTP_SECURE` | Boolean | No | `true` | Use SSL/TLS for SMTP |

### File Upload Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `MAX_FILE_SIZE` | Number | No | `10485760` | Maximum file upload size in bytes (default 10MB) |
| `UPLOAD_DIR` | String | No | `./uploads` | Local upload directory path |
| `ALLOWED_MIME_TYPES` | String | No | - | Comma-separated MIME types (e.g., `application/pdf,image/jpeg`) |

### AWS S3 Configuration (Optional)

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | String | No | - | AWS access key ID |
| `AWS_SECRET_ACCESS_KEY` | String | No | - | AWS secret access key |
| `AWS_REGION` | String | No | `us-east-1` | AWS region |
| `AWS_S3_BUCKET` | String | No | - | S3 bucket name for file uploads |
| `AWS_S3_PREFIX` | String | No | `uploads/` | S3 key prefix for uploaded files |

### Error Tracking (Sentry)

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `SENTRY_DSN` | String | No | - | Sentry project DSN for error tracking |
| `SENTRY_ENVIRONMENT` | String | No | `production` | Sentry environment tag |
| `SENTRY_SAMPLE_RATE` | Number | No | `0.1` | Sentry transaction sample rate (0-1) |

### Feature Flags

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `ENABLE_TWO_FACTOR_AUTH` | Boolean | No | `true` | Enable 2FA functionality |
| `ENABLE_AUDIT_LOGGING` | Boolean | No | `true` | Enable audit logging |
| `ENABLE_RATE_LIMITING` | Boolean | No | `true` | Enable rate limiting |
| `ENABLE_CACHE` | Boolean | No | `true` | Enable caching |

### Logging Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `LOG_FORMAT` | String | No | `json` | Log format: `json` or `text` |
| `LOG_OUTPUT` | String | No | `console` | Log output: `console` or `file` |
| `LOG_FILE_PATH` | String | No | `./logs` | Directory for log files |

### Analytics & Monitoring

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `MIXPANEL_TOKEN` | String | No | - | Mixpanel analytics token |
| `GOOGLE_ANALYTICS_ID` | String | No | - | Google Analytics ID |

### Third-Party Services

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `SLACK_WEBHOOK_URL` | String | No | - | Slack webhook for notifications |
| `WEBHOOK_SECRET` | String | No | - | Secret for webhook verification |

---

## Frontend Environment Variables

### Important Note
Frontend variables must be prefixed with `REACT_APP_` to be accessible in React applications.

### Core Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REACT_APP_ENV` | String | No | `development` | Runtime environment |
| `REACT_APP_VERSION` | String | No | `1.0.0` | Application version |
| `REACT_APP_DEBUG` | Boolean | No | `false` | Enable debug logging |

### API Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REACT_APP_API_BASE_URL` | String | Yes | - | Backend API base URL |
| `REACT_APP_API_TIMEOUT` | Number | No | `30000` | API request timeout in milliseconds |

### Authentication

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REACT_APP_JWT_STORAGE_KEY` | String | No | `auth_token` | LocalStorage key for JWT token |
| `REACT_APP_SESSION_STORAGE_KEY` | String | No | `session` | SessionStorage key |
| `REACT_APP_ENABLE_REMEMBER_ME` | Boolean | No | `true` | Enable "Remember Me" functionality |
| `REACT_APP_OAUTH_CLIENT_ID` | String | No | - | OAuth2 client ID |
| `REACT_APP_OAUTH_REDIRECT_URI` | String | No | - | OAuth2 redirect URI |

### Feature Flags

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REACT_APP_ENABLE_ANALYTICS` | Boolean | No | `true` | Enable analytics tracking |
| `REACT_APP_ENABLE_DARK_MODE` | Boolean | No | `true` | Enable dark mode toggle |
| `REACT_APP_ENABLE_TWO_FACTOR` | Boolean | No | `true` | Enable 2FA UI |
| `REACT_APP_ENABLE_EXPORT` | Boolean | No | `true` | Enable export functionality |

### Error Tracking (Sentry)

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REACT_APP_SENTRY_DSN` | String | No | - | Sentry DSN for frontend errors |
| `REACT_APP_SENTRY_ENVIRONMENT` | String | No | `production` | Sentry environment |
| `REACT_APP_SENTRY_SAMPLE_RATE` | Number | No | `0.1` | Sample rate for transactions (0-1) |

### Analytics

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REACT_APP_GOOGLE_ANALYTICS_ID` | String | No | - | Google Analytics ID |
| `REACT_APP_MIXPANEL_TOKEN` | String | No | - | Mixpanel analytics token |

### UI Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REACT_APP_THEME` | String | No | `light` | Default theme: `light` or `dark` |
| `REACT_APP_PRIMARY_COLOR` | String | No | `#1f2937` | Primary brand color |
| `REACT_APP_SECONDARY_COLOR` | String | No | `#3b82f6` | Secondary brand color |
| `REACT_APP_ITEMS_PER_PAGE` | Number | No | `10` | Items per page for tables |

### File Upload

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REACT_APP_MAX_FILE_SIZE` | Number | No | `10485760` | Maximum file size in bytes |
| `REACT_APP_ALLOWED_FILE_TYPES` | String | No | `pdf,jpg,jpeg,png` | Comma-separated allowed file types |

### Notifications

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REACT_APP_ENABLE_NOTIFICATIONS` | Boolean | No | `true` | Enable toast notifications |
| `REACT_APP_NOTIFICATION_TIMEOUT` | Number | No | `5000` | Notification display timeout in ms |

### Application URLs

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REACT_APP_APP_URL` | String | No | - | Application main URL |
| `REACT_APP_SUPPORT_EMAIL` | String | No | - | Support email address |
| `REACT_APP_DOCUMENTATION_URL` | String | No | - | Documentation URL |

### Third-Party Services

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REACT_APP_GOOGLE_MAPS_KEY` | String | No | - | Google Maps API key |
| `REACT_APP_STRIPE_PUBLIC_KEY` | String | No | - | Stripe public key (if using payments) |
| `REACT_APP_S3_BUCKET` | String | No | - | S3 bucket for direct uploads |
| `REACT_APP_S3_REGION` | String | No | `us-east-1` | S3 region |

---

## Railway-Specific Configuration

### Railway Dashboard Setup

When deploying to Railway, set the following variables in the Railway dashboard:

```
Settings → Variables → Add Variable
```

Or via CLI:

```bash
railway set VARIABLE_NAME=value
```

### PostgreSQL Auto-Variables

Railway automatically provides these for the PostgreSQL plugin:

```
DATABASE_URL=postgresql://user:password@postgres.railway.internal:5432/railway
PGHOST=postgres.railway.internal
PGPORT=5432
PGDATABASE=railway
PGUSER=postgres
PGPASSWORD=[auto-generated]
```

### Example Railway Setup

```bash
# Set environment variables
railway set NODE_ENV=production
railway set JWT_SECRET=$(openssl rand -base64 32)
railway set API_BASE_URL=https://yourdomain.com
railway set CORS_ORIGIN=https://yourdomain.com

# View all variables
railway variables
```

---

## Local Development Setup

### Create .env files

**backend/.env**
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/bform_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-change-in-production
API_BASE_URL=http://localhost:5000
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

**frontend/.env**
```env
REACT_APP_ENV=development
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_DEBUG=true
REACT_APP_VERSION=1.0.0
```

### Docker Compose
The `docker-compose.yml` automatically reads from `.env` file:

```bash
# Copy examples
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit as needed
nano backend/.env
nano frontend/.env

# Start services
docker-compose up -d
```

---

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong secrets**: Minimum 32 characters for JWT_SECRET
3. **Rotate secrets regularly** in production
4. **Use environment-specific values**: Different secrets for dev/staging/prod
5. **Store sensitive data in Railway dashboard**, not in code
6. **Use HTTPS_ONLY** in production (set `SESSION_COOKIE_SECURE=true`)
7. **Enable CORS carefully**: Only allow trusted origins
8. **Validate all file uploads**: Set appropriate `MAX_FILE_SIZE` and `ALLOWED_MIME_TYPES`

---

## Validation

Before deploying, verify all required variables are set:

```bash
# Check Railway variables
railway variables

# Verify database connection
railway shell backend --command "psql \$DATABASE_URL -c 'SELECT 1'"

# Test API
curl https://api.yourdomain.com/health
```

---

## Troubleshooting

### Variable Not Found Error

- Ensure variable is prefixed with `REACT_APP_` for frontend
- Check variable name is correct (case-sensitive)
- Restart services after changing variables

### Database Connection Failed

- Verify `DATABASE_URL` format
- Check database is running
- Verify user has database access

### CORS Errors

- Check `CORS_ORIGIN` matches frontend domain
- Include protocol (http:// or https://)
- Use comma-separated list for multiple origins

For more help, check the main [deployment-guide.md](./deployment-guide.md).
