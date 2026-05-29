#!/bin/bash
# Run this on a fresh Ubuntu 22.04 DO droplet as root
set -e

echo "=== mrgin droplet setup ==="

# System deps
apt-get update -q
apt-get install -y -q nginx certbot python3-certbot-nginx postgresql postgresql-contrib redis-server

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# PM2
npm install -g pm2 tsx

# Postgres: create db + user
sudo -u postgres psql <<SQL
CREATE USER mrgin WITH PASSWORD 'changeme';
CREATE DATABASE mrgin OWNER mrgin;
GRANT ALL PRIVILEGES ON DATABASE mrgin TO mrgin;
SQL

# Redis: bind to localhost only (already default)
systemctl enable redis-server
systemctl start redis-server

# App directory
mkdir -p /opt/mrgin
echo "Droplet ready. Now:"
echo "  1. scp -r app/ root@YOUR_IP:/opt/mrgin/"
echo "  2. cd /opt/mrgin && cp .env.example .env && vim .env"
echo "  3. npm install"
echo "  4. npx drizzle-kit push  (runs migrations)"
echo "  5. pm2 start ecosystem.config.js"
echo "  6. certbot --nginx -d your-domain.com"
