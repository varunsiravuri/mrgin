#!/usr/bin/env bash
# Deploy mrgin backend to a DigitalOcean droplet.
#
# First-time (create droplet in DO UI, add your SSH key, then):
#   DROPLET_IP=1.2.3.4 ./scripts/deploy-backend-do.sh --bootstrap
#
# Updates (code + env + restart):
#   DROPLET_IP=1.2.3.4 ./scripts/deploy-backend-do.sh
#
# Optional:
#   DROPLET_USER=root
#   MRGIN_DOMAIN=api.yourdomain.com   # enables nginx + certbot
#   DO_TOKEN=... ./scripts/deploy-backend-do.sh --create-droplet
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DROPLET_IP="${DROPLET_IP:-}"
DROPLET_USER="${DROPLET_USER:-root}"
MRGIN_DOMAIN="${MRGIN_DOMAIN:-}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
REMOTE="${DROPLET_USER}@${DROPLET_IP}"
APP_REMOTE="/opt/mrgin/app"
ENV_LOCAL="$ROOT/app/.env"

usage() {
  sed -n '2,12p' "$0" | sed 's/^# \?//'
  exit 1
}

create_droplet() {
  local token="${DO_TOKEN:-}"
  if [ -z "$token" ]; then
    echo "Set DO_TOKEN to create a droplet via API, or create one in the DO console and set DROPLET_IP."
    exit 1
  fi

  local name="${DROPLET_NAME:-mrgin-api}"
  local region="${DO_REGION:-sgp1}"
  local size="${DO_SIZE:-s-2vcpu-4gb}"
  local ssh_key_id="${DO_SSH_KEY_ID:-}"

  if [ -z "$ssh_key_id" ]; then
    echo "Set DO_SSH_KEY_ID (numeric ID from DO → Settings → Security → SSH keys)."
    exit 1
  fi

  echo "Creating droplet ${name} (${size}, ${region})..."
  RESP=$(curl -sf -X POST "https://api.digitalocean.com/v2/droplets" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${name}\",\"region\":\"${region}\",\"size\":\"${size}\",\"image\":\"ubuntu-22-04-x64\",\"ssh_keys\":[${ssh_key_id}]}")

  DROPLET_ID=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['droplet']['id'])")
  echo "Droplet id: ${DROPLET_ID} — waiting for IP..."

  for _ in $(seq 1 60); do
    INFO=$(curl -sf -H "Authorization: Bearer ${token}" "https://api.digitalocean.com/v2/droplets/${DROPLET_ID}")
    DROPLET_IP=$(echo "$INFO" | python3 -c "import sys,json; d=json.load(sys.stdin)['droplet']; print(next((n['ip_address'] for n in d['networks']['v4'] if n['type']=='public'),''))")
    [ -n "$DROPLET_IP" ] && break
    sleep 5
  done

  if [ -z "$DROPLET_IP" ]; then
    echo "Timed out waiting for droplet IP."
    exit 1
  fi
  echo "Droplet IP: ${DROPLET_IP}"
  REMOTE="${DROPLET_USER}@${DROPLET_IP}"
  sleep 15
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
fi

if [ "${1:-}" = "--create-droplet" ]; then
  create_droplet
  shift
  BOOTSTRAP=1
fi

if [ "${1:-}" = "--bootstrap" ]; then
  BOOTSTRAP=1
  shift
fi

if [ -z "$DROPLET_IP" ]; then
  echo "Set DROPLET_IP to your droplet's public IP."
  usage
fi

if [ ! -f "$ENV_LOCAL" ]; then
  echo "Missing $ENV_LOCAL — copy app/.env.example and fill in secrets first."
  exit 1
fi

echo "=== Deploying backend to ${REMOTE} ==="

if [ "${BOOTSTRAP:-0}" = "1" ]; then
  echo "Running first-boot setup on droplet..."
  scp "${SSH_OPTS[@]}" "$ROOT/scripts/setup-droplet.sh" "${REMOTE}:/tmp/setup-droplet.sh"
  ssh "${SSH_OPTS[@]}" "$REMOTE" "bash /tmp/setup-droplet.sh"
fi

echo "Syncing Anchor IDL files..."
ssh "${SSH_OPTS[@]}" "$REMOTE" "mkdir -p /opt/mrgin/target/idl"
for idl in perp_engine cross_margin prediction_market; do
  if [ -f "$ROOT/app/${idl}.json" ]; then
    scp "${SSH_OPTS[@]}" "$ROOT/app/${idl}.json" "${REMOTE}:/opt/mrgin/target/idl/"
  elif [ -f "$ROOT/target/idl/${idl}.json" ]; then
    scp "${SSH_OPTS[@]}" "$ROOT/target/idl/${idl}.json" "${REMOTE}:/opt/mrgin/target/idl/"
  fi
done
ssh "${SSH_OPTS[@]}" "$REMOTE" "mkdir -p /opt/mrgin"
rsync -az --delete \
  --exclude node_modules \
  --exclude .env \
  "$ROOT/app/" "${REMOTE}:${APP_REMOTE}/"
scp "${SSH_OPTS[@]}" "$ROOT/ecosystem.config.js" "${REMOTE}:/opt/mrgin/ecosystem.config.js"
scp "${SSH_OPTS[@]}" "$ENV_LOCAL" "${REMOTE}:${APP_REMOTE}/.env"

# Production DATABASE_URL on droplet (Postgres local to droplet)
ssh "${SSH_OPTS[@]}" "$REMOTE" bash <<'REMOTE_SCRIPT'
set -euo pipefail
APP=/opt/mrgin/app
cd "$APP"

PG_PASS=$(grep '^DATABASE_URL=' "$APP/.env" | sed -n 's|.*://mrgin:\([^@]*\)@.*|\1|p' || true)
PG_PASS="${PG_PASS:-changeme}"

# Align local Postgres with app/.env
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL || true
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'mrgin') THEN
    CREATE USER mrgin WITH PASSWORD '${PG_PASS}';
  ELSE
    ALTER USER mrgin WITH PASSWORD '${PG_PASS}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE mrgin OWNER mrgin'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mrgin')\gexec
GRANT ALL PRIVILEGES ON DATABASE mrgin TO mrgin;
SQL

sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://mrgin:${PG_PASS}@127.0.0.1:5432/mrgin|" "$APP/.env"
grep -q '^REDIS_URL=' "$APP/.env" || echo 'REDIS_URL=redis://127.0.0.1:6379' >> "$APP/.env"
sed -i 's|^REDIS_URL=.*|REDIS_URL=redis://127.0.0.1:6379|' "$APP/.env"

npm install
cd api && npx drizzle-kit push
cd "$APP"
bash -c 'source .env 2>/dev/null || true; MARKET="${MARKET_ADDRESSES%%,*}"; if [ -n "$MARKET" ]; then redis-cli SET "price:${MARKET}" 100000000; redis-cli SET "stats:${MARKET}" '"'"'{"symbol":"SOL-PERP","openInterest":0,"fundingRate":0}'"'"'; fi'

export MRGIN_APP_ROOT="$APP"
pm2 start /opt/mrgin/ecosystem.config.js --update-env 2>/dev/null || pm2 reload /opt/mrgin/ecosystem.config.js --update-env
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash || true

sleep 2
curl -sf "http://127.0.0.1:3001/health" >/dev/null && echo "API health: OK" || echo "API health: FAILED"
curl -sf "http://127.0.0.1:3002/health" >/dev/null && echo "Indexer health: OK" || echo "Indexer health: FAILED"
REMOTE_SCRIPT

if [ -n "$MRGIN_DOMAIN" ]; then
  echo "Configuring nginx for ${MRGIN_DOMAIN}..."
  scp "${SSH_OPTS[@]}" "$ROOT/deploy/nginx/mrgin.conf" "${REMOTE}:/tmp/mrgin.conf"
  ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s <<EOF
set -euo pipefail
sed -i "s/YOUR_DOMAIN/${MRGIN_DOMAIN}/g" /tmp/mrgin.conf
mv /tmp/mrgin.conf /etc/nginx/sites-available/mrgin
ln -sf /etc/nginx/sites-available/mrgin /etc/nginx/sites-enabled/mrgin
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
if ! certbot certificates 2>/dev/null | grep -q "${MRGIN_DOMAIN}"; then
  certbot --nginx -d "${MRGIN_DOMAIN}" --non-interactive --agree-tos -m "admin@${MRGIN_DOMAIN}" || true
fi
EOF
  PUBLIC_API="https://${MRGIN_DOMAIN}"
else
  echo "Configuring nginx (HTTP on port 80)..."
  ssh "${SSH_OPTS[@]}" "$REMOTE" bash <<'NGINX_EOF'
set -euo pipefail
cat > /etc/nginx/sites-available/mrgin << 'NGINX'
upstream mrgin_api { server 127.0.0.1:3001; keepalive 32; }
upstream mrgin_indexer { server 127.0.0.1:3002; keepalive 8; }
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    location /webhook {
        proxy_pass http://mrgin_indexer/webhook;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location / {
        proxy_pass http://mrgin_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/mrgin /etc/nginx/sites-enabled/mrgin
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
NGINX_EOF
  PUBLIC_API="http://${DROPLET_IP}"
  echo ""
  echo "Helius webhooks need HTTPS — add a domain (MRGIN_DOMAIN) when ready."
fi

echo ""
echo "=== Backend deploy complete ==="
echo "  API:     ${PUBLIC_API}"
echo "  Health:  ${PUBLIC_API}/health"
echo "  Markets: ${PUBLIC_API}/markets"
if [ -n "$MRGIN_DOMAIN" ]; then
  echo "  Webhook: https://${MRGIN_DOMAIN}/webhook"
  echo ""
  echo "Update app/.env WEBHOOK_PUBLIC_URL=https://${MRGIN_DOMAIN} then run:"
  echo "  DROPLET_IP=${DROPLET_IP} ./scripts/deploy-backend-do.sh"
  echo "  ./scripts/setup-helius-webhook.sh"
fi
echo ""
echo "Set on Vercel (frontend):"
echo "  NEXT_PUBLIC_API_URL=${PUBLIC_API}"
