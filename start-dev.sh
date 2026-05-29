#!/bin/bash
# Start the full mrgin dev stack locally
# Run from project root: ./start-dev.sh

set -e
cd "$(dirname "$0")"

echo "=== mrgin dev stack ==="

# Start Redis if not running
redis-cli ping >/dev/null 2>&1 || brew services start redis

# Start Postgres if not running
psql -U mrgin -d mrgin -c "SELECT 1" >/dev/null 2>&1 || brew services start postgresql@16

# Seed mark price in Redis (from on-chain value)
MARKET="FG2Ggfmyxt6LfzHXXZbBfMy35Z2HaKuBQFA8o3aCBPZQ"
redis-cli SET "price:${MARKET}" 100000000 >/dev/null
redis-cli SET "stats:${MARKET}" '{"symbol":"SOL-PERP","openInterest":0,"fundingRate":0}' >/dev/null
echo "Redis seeded: mark=$100"

# Backend services
cd app
npx tsx api/src/index.ts &
echo "API started (port 3001)"
npx tsx matching-engine/src/index.ts &
echo "Matching engine started"
npx tsx bots/src/index.ts &
echo "Bots started (liquidator + funding crank)"

cd ../frontend
npm run dev &
echo "Frontend started (port 3000)"

echo ""
echo "=== All services running ==="
echo "  Frontend:  http://localhost:3000"
echo "  API:       http://localhost:3001"
echo "  Health:    http://localhost:3001/health"
echo "  Markets:   http://localhost:3001/markets"
echo ""
echo "Press Ctrl+C to stop all services"
wait
