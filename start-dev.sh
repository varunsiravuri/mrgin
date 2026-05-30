#!/bin/bash
# Start the full mrgin dev stack locally
# Run from project root: ./start-dev.sh

set -e
cd "$(dirname "$0")"

echo "=== mrgin dev stack ==="

free_port() {
  local port=$1
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Freeing port $port..."
    kill $pids 2>/dev/null || true
    sleep 1
  fi
}

free_port 3001
free_port 3000
free_port 3002

# Start Redis if not running
redis-cli ping >/dev/null 2>&1 || brew services start redis

# Start Postgres if not running
PSQL="${PSQL:-$(command -v psql 2>/dev/null || echo /opt/homebrew/opt/postgresql@16/bin/psql)}"
"$PSQL" -U mrgin -d mrgin -c "SELECT 1" >/dev/null 2>&1 || brew services start postgresql@16

# Seed mark price in Redis (from on-chain value)
MARKET="FG2Ggfmyxt6LfzHXXZbBfMy35Z2HaKuBQFA8o3aCBPZQ"
redis-cli SET "price:${MARKET}" 100000000 >/dev/null
redis-cli SET "stats:${MARKET}" '{"symbol":"SOL-PERP","openInterest":0,"fundingRate":0}' >/dev/null
echo "Redis seeded: mark=\$100"

# Backend services
cd app
npx tsx api/src/index.ts &
echo "API started (port 3001)"
npx tsx matching-engine/src/index.ts &
echo "Matching engine started"
npx tsx bots/src/index.ts &
echo "Bots started (liquidator + funding crank)"
npx tsx indexer/src/index.ts &
echo "Indexer started (port 3002)"

cd ../frontend
npm run dev -- -p 3000 &
echo "Frontend started (port 3000)"

echo ""
echo "=== All services running ==="
echo "  Frontend:  http://localhost:3000"
echo "  API:       http://localhost:3001"
echo "  Health:    http://localhost:3001/health"
echo "  Markets:   http://localhost:3001/markets"
echo "  Indexer:   http://localhost:3002/health"
echo "  Webhook:   run scripts/setup-helius-webhook.sh after stack is up"
echo ""
echo "Press Ctrl+C to stop all services"
wait
