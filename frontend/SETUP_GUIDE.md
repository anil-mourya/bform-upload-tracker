# B-Form Upload Tracker - Setup Guide

Complete guide for setting up and deploying the B-Form Upload Tracker application.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Environment Configuration](#environment-configuration)
3. [Backend API Setup](#backend-api-setup)
4. [Running the Application](#running-the-application)
5. [Troubleshooting](#troubleshooting)
6. [Production Deployment](#production-deployment)
7. [Docker Setup](#docker-setup)

## Local Development Setup

### Prerequisites

Ensure you have the following installed:
- Node.js >= 16.0.0 ([Download](https://nodejs.org))
- npm >= 8.0.0 or yarn >= 3.0.0
- Git
- A code editor (VS Code recommended)

### Verify Installation

```bash
# Check Node.js version
node --version
# Expected output: v16.0.0 or higher

# Check npm version
npm --version
# Expected output: 8.0.0 or higher
```

### Clone Repository

```bash
# Clone the repository
git clone <repository-url> b-form-tracker
cd b-form-tracker

# Or if you already have the files:
cd b-form-tracker
```

### Install Dependencies

```bash
# Install all dependencies
npm install

# or if using yarn
yarn install

# Verify installation
npm list react react-dom axios date-fns lucide-react
```

## Environment Configuration

### Create Environment File

```bash
# Copy example environment file
cp .env.example .env
```

### Configure Environment Variables

Edit `.env` file with your settings:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# App Settings
REACT_APP_APP_NAME=B-Form Upload Tracker
REACT_APP_ENVIRONMENT=development

# Features
REACT_APP_ENABLE_EXPORT=true
REACT_APP_ENABLE_SEARCH=true
REACT_APP_ENABLE_FILTERING=true
REACT_APP_SHOW_STATISTICS=true

# UI
REACT_APP_ITEMS_PER_PAGE=10
```

### Environment Variables Explained

| Variable | Description | Default |
|----------|-------------|---------|
| REACT_APP_API_URL | Backend API URL | http://localhost:5000/api |
| REACT_APP_APP_NAME | Application name | B-Form Upload Tracker |
| REACT_APP_ENVIRONMENT | Environment (development/production) | development |
| REACT_APP_AUTH_ENABLED | Enable authentication | true |
| REACT_APP_ENABLE_EXPORT | Enable CSV export | true |
| REACT_APP_ENABLE_SEARCH | Enable search | true |
| REACT_APP_ENABLE_FILTERING | Enable filtering | true |
| REACT_APP_ITEMS_PER_PAGE | Default pagination size | 10 |
| REACT_APP_SHOW_STATISTICS | Show stats cards | true |

## Backend API Setup

### Start Backend API

The frontend requires a backend API running on the specified URL.

#### Option 1: Using Node.js Backend

```bash
# Clone backend repository (if separate)
git clone <backend-repo-url> ../b-form-api
cd ../b-form-api

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure database and port
# Edit .env with your database credentials

# Run migrations (if using database)
npm run migrate

# Start the server
npm run dev
```

#### Option 2: Using Mock API (for testing)

For testing without a backend, the application includes mock data handling.

### Backend Requirements

The backend API must provide:

1. **Authentication Endpoint**
   - POST `/auth/login` - User login
   - POST `/auth/logout` - User logout
   - POST `/auth/refresh` - Token refresh

2. **B-Form Endpoints** (see API_DOCUMENTATION.md for details)
   - GET `/api/b-forms/tracker` - Get tracker data
   - GET `/api/b-forms/stats` - Get statistics
   - POST `/api/b-forms/upload` - Upload B-Form
   - GET `/api/b-forms/search` - Search B-Forms
   - And other endpoints as documented

### Testing API Connection

```bash
# Test API connectivity
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/b-forms/stats

# Expected response should be valid JSON
```

## Running the Application

### Development Server

```bash
# Start development server
npm run dev

# Output:
#   VITE v5.0.0  ready in 123 ms
#   ➜  Local:   http://localhost:3000/
#   ➜  press h to show help
```

### Access Application

Open your browser and navigate to:
```
http://localhost:3000
```

### Hot Module Replacement (HMR)

The development server supports HMR. Changes to components will automatically refresh the browser without losing state.

### Building for Production

```bash
# Build the application
npm run build

# Output files in dist/ directory
# Output:
#   dist/index.html                  1.23 kb
#   dist/assets/index.abc123.js      245.67 kb
#   dist/assets/index.def456.css     12.34 kb
```

### Preview Production Build

```bash
# Preview the production build
npm run preview

# Output:
#   ➜  Local:   http://localhost:4173/
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues automatically
npm run lint -- --fix
```

### Code Formatting

```bash
# Format code with Prettier
npm run format
```

## Troubleshooting

### Issue: CORS Errors

**Problem**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solutions**:

1. Check backend has CORS enabled:
```javascript
// Backend (Express example)
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

2. Verify API URL in `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

3. Check backend is running:
```bash
curl http://localhost:5000/api/health
```

### Issue: Authentication Token Errors

**Problem**: `401 Unauthorized - Invalid or expired token`

**Solutions**:

1. Clear browser storage and login again:
```javascript
localStorage.removeItem('authToken');
sessionStorage.clear();
```

2. Check token expiration:
```javascript
// In browser console
console.log(localStorage.getItem('authToken'));
```

3. Verify backend token generation

### Issue: API Data Not Loading

**Problem**: Empty tables, no data displayed

**Solutions**:

1. Check network tab in DevTools:
   - Open DevTools (F12)
   - Go to Network tab
   - Check API request status

2. Check browser console for errors:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for error messages

3. Verify API endpoints in `src/services/uploadTrackerService.js`

4. Test API directly:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/b-forms/tracker?year=2024
```

### Issue: Build Fails

**Problem**: `npm run build` returns errors

**Solutions**:

1. Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

2. Check Node.js version:
```bash
node --version
# Should be >= 16.0.0
```

3. Clear Vite cache:
```bash
rm -rf dist .vite
npm run build
```

### Issue: Port Already in Use

**Problem**: `Port 3000 is already in use`

**Solutions**:

1. Use a different port:
```bash
npm run dev -- --port 3001
```

2. Kill process using port 3000:
```bash
# On macOS/Linux
lsof -i :3000
kill -9 <PID>

# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: Responsive Design Not Working

**Problem**: Mobile view not displaying correctly

**Solutions**:

1. Clear browser cache
2. Check viewport meta tag in `public/index.html`
3. Test in DevTools mobile view (F12 > Toggle device toolbar)
4. Check CSS media queries in style files

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] API endpoints verified
- [ ] HTTPS enabled for backend
- [ ] CORS properly configured
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Performance optimized

### Build Optimization

```bash
# Analyze bundle size
npm run build -- --analyze

# Update vite.config.js for production
```

### Environment Setup

Create `.env.production`:

```env
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_APP_NAME=B-Form Upload Tracker
REACT_APP_ENVIRONMENT=production
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Deploy to AWS S3 + CloudFront

```bash
# Build
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## Docker Setup

### Build Docker Image

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

### Build and Run

```bash
# Build image
docker build -t b-form-tracker .

# Run container
docker run -p 3000:3000 \
  -e REACT_APP_API_URL=http://api:5000/api \
  b-form-tracker

# Run in background
docker run -d -p 3000:3000 --name b-form-app b-form-tracker
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://backend:5000/api
    depends_on:
      - backend

  backend:
    image: your-backend-image:latest
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/bforms
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: bforms
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run:
```bash
docker-compose up -d
```

## Performance Optimization

### Code Splitting

The application already implements code splitting via Vite. Monitor bundle sizes:

```bash
npm run build -- --analyze
```

### Lazy Loading

Images and components can be lazy-loaded:

```javascript
import { lazy, Suspense } from 'react';

const UploadedTable = lazy(() => import('./components/UploadedTable'));

export function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UploadedTable />
    </Suspense>
  );
}
```

### Caching Headers

Configure web server to cache static assets:

```nginx
# Nginx example
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location / {
  expires -1;
  add_header Cache-Control "public, max-age=0, must-revalidate";
}
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **HTTPS**: Always use HTTPS in production
3. **Token Storage**: Consider using httpOnly cookies instead of localStorage
4. **Content Security Policy**: Configure CSP headers
5. **Input Validation**: Validate all user inputs
6. **API Security**: Implement rate limiting and authentication

## Support and Resources

- **Documentation**: See README.md and API_DOCUMENTATION.md
- **Issues**: Create an issue in the repository
- **Discussions**: Use GitHub Discussions for questions
- **Email**: dev-team@example.com

## Next Steps

1. Set up the backend API
2. Configure environment variables
3. Run the development server
4. Verify all features work
5. Deploy to production
