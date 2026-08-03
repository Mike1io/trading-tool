# Production Deployment Guide: Real-Time Crypto Intelligence Platform

This document outlines the step-by-step procedure for deploying the **Crypto Intelligence Platform** to production using **Docker Compose, Nginx (SSL/HTTPS + WebSockets), PM2, Redis, GitHub Actions CI/CD, Automated Database Backups, and Health Checks**.

---

## 1. Environment Configuration

1. SSH into your Ubuntu/Debian production server:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

2. Clone repository to `/opt/crypto-intel-platform`:
   ```bash
   cd /opt
   git clone https://github.com/your-org/crypto-intel-platform.git
   cd crypto-intel-platform
   ```

3. Copy production environment configuration template:
   ```bash
   cp .env.example .env
   ```

4. Edit secrets in `.env`:
   ```env
   NODE_ENV=production
   PORT=8080
   DOMAIN_NAME=crypto-intel.io
   DATABASE_URL=postgresql://postgres:STRONG_DB_PASSWORD@postgres:5432/crypto_intel?schema=public
   POSTGRES_PASSWORD=STRONG_DB_PASSWORD
   REDIS_PASSWORD=STRONG_REDIS_PASSWORD
   JWT_ACCESS_SECRET=your_production_32_byte_access_secret_key
   JWT_REFRESH_SECRET=your_production_32_byte_refresh_secret_key
   ```

---

## 2. SSL / HTTPS Certificate Setup (Let's Encrypt)

1. Obtain SSL Certificates via Certbot:
   ```bash
   apt install certbot
   certbot certonly --standalone -d crypto-intel.io -d www.crypto-intel.io
   ```

2. Copy certificate keys to `nginx/ssl/live/`:
   ```bash
   mkdir -p nginx/ssl/live
   cp /etc/letsencrypt/live/crypto-intel.io/fullchain.pem nginx/ssl/live/
   cp /etc/letsencrypt/live/crypto-intel.io/privkey.pem nginx/ssl/live/
   ```

---

## 3. Launching Containers via Docker Compose

1. Build and start all production services:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

2. Verify running containers:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

3. Run database migrations:
   ```bash
   docker exec -it crypto_intel_api_prod npx prisma migrate deploy
   ```

---

## 4. Automated Backups & Cron Job

1. Make backup script executable:
   ```bash
   chmod +x scripts/backup.sh scripts/healthcheck.sh
   ```

2. Setup cron job to run daily backups at 02:00 AM:
   ```bash
   crontab -e
   ```
   Add line:
   ```cron
   0 2 * * * /opt/crypto-intel-platform/scripts/backup.sh >> /var/log/crypto_intel_backup.log 2>&1
   ```

---

## 5. Health Monitoring & CI/CD Pipeline

1. Run manual health check:
   ```bash
   ./scripts/healthcheck.sh
   ```

2. Configure GitHub Secrets in repository (`Settings -> Secrets -> Actions`):
   - `PROD_SERVER_IP`: Public IP of production server.
   - `PROD_SERVER_USER`: Deployment SSH user (e.g. `root` or `ubuntu`).
   - `PROD_SSH_PRIVATE_KEY`: Private SSH Key for automated deployments.

3. Push to `main` branch to trigger automated GitHub Actions deployment.
