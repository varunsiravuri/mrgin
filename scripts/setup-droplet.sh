#!/bin/bash
# Run on a fresh Ubuntu 22.04 DigitalOcean droplet as root (first boot only).
set -euo pipefail

echo "=== mrgin droplet setup ==="

export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q curl git nginx certbot python3-certbot-nginx ufw

# Node.js 20 + PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y -q nodejs
npm install -g pm2

# Postgres 16
apt-get install -y -q postgresql postgresql-contrib redis-server

systemctl enable postgresql redis-server nginx
systemctl start postgresql redis-server nginx

# App db (change password in production via POSTGRES_PASSWORD env)
PG_PASS="${POSTGRES_PASSWORD:-changeme}"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'mrgin') THEN
    CREATE USER mrgin WITH PASSWORD '${PG_PASS}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE mrgin OWNER mrgin'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mrgin')\gexec
GRANT ALL PRIVILEGES ON DATABASE mrgin TO mrgin;
SQL

# Firewall: SSH + HTTP/S (nginx). API/indexer are localhost-only behind nginx.
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

mkdir -p /opt/mrgin
echo ""
echo "=== Droplet base image ready ==="
echo "Next from your laptop:"
echo "  DROPLET_IP=<ip> ./scripts/deploy-backend-do.sh"
echo ""
echo "Optional: set POSTGRES_PASSWORD before re-running this script to pick a strong DB password."
