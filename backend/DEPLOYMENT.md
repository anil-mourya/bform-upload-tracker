# B-Form Upload Tracker - Deployment Guide

This guide provides detailed instructions for deploying the B-Form Upload Tracker API in various environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment](#production-deployment)
4. [AWS Deployment](#aws-deployment)
5. [DigitalOcean Deployment](#digitalocean-deployment)
6. [Heroku Deployment](#heroku-deployment)
7. [Troubleshooting](#troubleshooting)

## Local Development

### Prerequisites

- Node.js v14+ 
- MySQL 5.7+
- npm or yarn

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```

3. **Update .env with local settings**
   ```env
   PORT=5000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=root
   DB_NAME=bform_tracker
   JWT_SECRET=dev-secret-key-not-for-production
   ```

4. **Create database**
   ```bash
   mysql -u root -p
   > CREATE DATABASE bform_tracker;
   > EXIT;
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   API will be available at `http://localhost:5000`

## Docker Deployment

### Quick Start with Docker Compose

#### Prerequisites
- Docker
- Docker Compose

#### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bform-tracker-api
   ```

2. **Create .env file**
   ```bash
   cp .env.example .env
   ```

3. **Update environment variables**
   ```env
   NODE_ENV=development
   PORT=5000
   DB_USER=bform_user
   DB_PASSWORD=strong_db_password_here
   DB_NAME=bform_tracker
   JWT_SECRET=your_super_secret_jwt_key
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start services**
   ```bash
   docker-compose up -d
   ```

5. **Check logs**
   ```bash
   docker-compose logs -f api
   ```

6. **Verify deployment**
   ```bash
   curl http://localhost:5000/health
   ```

7. **Stop services**
   ```bash
   docker-compose down
   ```

### Building Custom Docker Image

```bash
# Build image
docker build -t bform-tracker-api:1.0.0 .

# Run container
docker run -d \
  --name bform-api \
  -p 5000:5000 \
  -e DB_HOST=mysql \
  -e DB_USER=bform_user \
  -e DB_PASSWORD=password \
  -e JWT_SECRET=secret \
  bform-tracker-api:1.0.0

# View logs
docker logs -f bform-api

# Stop container
docker stop bform-api
```

## Production Deployment

### Prerequisites for Production

- Linux server (Ubuntu 20.04 LTS recommended)
- Nginx as reverse proxy
- MySQL 8.0
- Node.js 18 LTS
- PM2 for process management
- SSL certificate (Let's Encrypt)

### Steps

1. **Setup server**
   ```bash
   sudo apt update
   sudo apt upgrade -y
   sudo apt install -y nodejs npm mysql-server nginx curl
   
   # Install PM2 globally
   sudo npm install -g pm2
   ```

2. **Clone and setup application**
   ```bash
   cd /var/www
   git clone <repository-url> bform-tracker
   cd bform-tracker
   npm install --production
   ```

3. **Configure MySQL**
   ```bash
   sudo mysql
   > CREATE DATABASE bform_tracker;
   > CREATE USER 'bform_user'@'localhost' IDENTIFIED BY 'strong_password';
   > GRANT ALL PRIVILEGES ON bform_tracker.* TO 'bform_user'@'localhost';
   > FLUSH PRIVILEGES;
   > EXIT;
   ```

4. **Setup .env**
   ```bash
   sudo cp .env.example .env
   sudo nano .env
   ```

   Update with:
   ```env
   NODE_ENV=production
   PORT=5000
   DB_HOST=localhost
   DB_USER=bform_user
   DB_PASSWORD=strong_password
   JWT_SECRET=generate_random_secure_string
   CORS_ORIGIN=https://yourdomain.com
   ```

5. **Setup PM2**
   ```bash
   pm2 start src/server.js --name "bform-api" --instances max
   pm2 startup
   pm2 save
   ```

6. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/bform-tracker
   ```

   ```nginx
   upstream bform_api {
     server localhost:5000;
     keepalive 64;
   }

   server {
     listen 80;
     server_name yourdomain.com www.yourdomain.com;
     return 301 https://$server_name$request_uri;
   }

   server {
     listen 443 ssl http2;
     server_name yourdomain.com www.yourdomain.com;

     ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

     ssl_protocols TLSv1.2 TLSv1.3;
     ssl_ciphers HIGH:!aNULL:!MD5;
     ssl_prefer_server_ciphers on;

     # Security headers
     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
     add_header X-Content-Type-Options nosniff always;
     add_header X-Frame-Options DENY always;

     location / {
       proxy_pass http://bform_api;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_cache_bypass $http_upgrade;

       # Timeouts for uploads
       proxy_read_timeout 300s;
       proxy_connect_timeout 75s;
       client_max_body_size 50M;
     }
   }
   ```

7. **Enable Nginx site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/bform-tracker /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Setup SSL (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
   ```

9. **Monitor with PM2**
   ```bash
   pm2 monit
   pm2 logs
   ```

## AWS Deployment

### Using EC2 + RDS

1. **Launch EC2 Instance**
   - AMI: Ubuntu 20.04 LTS
   - Instance type: t3.medium (minimum)
   - Security Group: Allow ports 22, 80, 443

2. **Launch RDS MySQL**
   - Engine: MySQL 8.0
   - DB instance: db.t3.micro (development) or larger for production
   - Allocate storage: 20GB+
   - Enable automated backups

3. **Connect and configure EC2**
   ```bash
   # SSH into instance
   ssh -i your-key.pem ubuntu@your-instance-ip
   
   # Follow production deployment steps above
   ```

4. **Update .env with RDS endpoint**
   ```env
   DB_HOST=your-rds-endpoint.us-east-1.rds.amazonaws.com
   DB_USER=admin
   DB_PASSWORD=your_rds_password
   ```

### Using Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB**
   ```bash
   eb init -p node.js-18 bform-tracker --region us-east-1
   ```

3. **Create .ebextensions/app.config**
   ```yaml
   option_settings:
     aws:elasticbeanstalk:container:nodejs:
       NodeCommand: "npm start"
     aws:elasticbeanstalk:application:environment:
       NODE_ENV: production
   ```

4. **Deploy**
   ```bash
   eb create bform-tracker-env
   eb deploy
   ```

## DigitalOcean Deployment

### Using DigitalOcean App Platform

1. **Connect repository**
   - Login to DigitalOcean
   - Click "Create" → "Apps"
   - Connect your GitHub repository

2. **Configure app spec**
   ```yaml
   name: bform-tracker
   services:
   - name: api
     github:
       repo: your-username/bform-tracker-api
       branch: main
     build_command: npm install
     run_command: npm start
     http_port: 5000
     envs:
     - key: NODE_ENV
       value: production
     - key: JWT_SECRET
       scope: RUN_TIME
   databases:
   - name: bform_db
     engine: MYSQL
     version: "8"
   ```

3. **Deploy**
   - Review and deploy

### Using DigitalOcean Droplet + Managed Database

1. **Create Droplet** (2GB RAM minimum)
2. **Create Managed Database** (MySQL)
3. **Setup following production deployment guide**

## Heroku Deployment

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create app**
   ```bash
   heroku create bform-tracker
   ```

3. **Add MySQL addon**
   ```bash
   heroku addons:create cleardb:ignite
   ```

4. **Configure environment**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_secret_key
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **View logs**
   ```bash
   heroku logs --tail
   ```

## Monitoring and Maintenance

### Logging

```bash
# PM2 logs
pm2 logs

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Database Backups

```bash
# Automated backup (add to cron)
0 2 * * * mysqldump -u bform_user -p'password' bform_tracker > /backups/bform_$(date +\%Y\%m\%d).sql
```

### Monitoring Performance

```bash
# CPU/Memory usage
top

# Process monitoring
pm2 monit

# Nginx status
sudo systemctl status nginx
```

## Troubleshooting

### Port already in use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Database connection error
```bash
# Test MySQL connection
mysql -h DB_HOST -u DB_USER -p

# Check MySQL service
sudo systemctl status mysql
```

### PM2 issues
```bash
# Restart PM2
pm2 restart all

# Delete and restart
pm2 delete all
pm2 start src/server.js
```

### Nginx issues
```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### Disk space issues
```bash
# Check disk usage
df -h

# Clear logs
pm2 logs --lines 100 > /dev/null

# Archive old uploads
find uploads -type f -mtime +90 -delete
```

## Scaling Considerations

1. **Load Balancing**: Use Nginx or AWS Load Balancer
2. **Database**: Enable read replicas for scaling reads
3. **Caching**: Implement Redis for session/data caching
4. **CDN**: Use CloudFront or Cloudflare for static content
5. **Auto-scaling**: Configure based on CPU/Memory metrics

## Security Checklist

- [ ] Change default passwords
- [ ] Enable SSH key authentication only
- [ ] Configure firewall rules
- [ ] Enable SSL/TLS certificates
- [ ] Set strong JWT_SECRET
- [ ] Enable database encryption
- [ ] Configure automated backups
- [ ] Enable audit logging
- [ ] Implement rate limiting
- [ ] Regular security updates

## Performance Optimization

```bash
# Enable compression in Nginx
gzip on;
gzip_types text/plain text/css application/json;

# Set cache headers
add_header Cache-Control "public, max-age=3600" always;

# Database optimization
ALTER TABLE b_form_uploads ADD INDEX idx_year_period (year, period);
ALTER TABLE b_form_uploads ADD INDEX idx_status (status);
```

## Rollback Procedure

```bash
# With PM2
pm2 stop bform-api
git checkout previous-version
npm install
pm2 restart bform-api

# Check logs
pm2 logs
```
