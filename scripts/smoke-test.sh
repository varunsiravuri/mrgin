#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MARKET="${MARKET:-FG2Ggfmyxt6LfzHXXZbBfMy35Z2HaKuBQFA8o3aCBPZQ}"
API="${API:-http://localhost:3001}"
FRONTEND="${FRONTEND:-http://localhost:3000}"
INDEXER="${INDEXER:-http://localhost:3002}"

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; exit 1; }

echo "==> mrgin smoke test"

health=$(curl -sf "$API/health") || fail "API health unreachable at $API/health"
echo "$health" | grep -q '"ok":true' || fail "API health not ok"
pass "API /health"

markets=$(curl -sf "$API/markets") || fail "API /markets unreachable"
echo "$markets" | grep -q "$MARKET" || fail "SOL-PERP market missing from /markets"
pass "API /markets"

ob=$(curl -sf "$API/orderbook/$MARKET") || fail "API orderbook unreachable"
echo "$ob" | grep -q '"bids"' || fail "orderbook shape invalid"
pass "API /orderbook/:market"

pred=$(curl -sf "$API/prediction-markets") || fail "API /prediction-markets unreachable"
echo "$pred" | grep -q 'ipl-final-2026' || fail "prediction markets empty"
pass "API /prediction-markets"

code=$(curl -sf -o /dev/null -w "%{http_code}" "$FRONTEND/")
[ "$code" = "200" ] || fail "frontend home returned $code"
pass "Frontend / ($code)"

for path in /perps /predictions /docs; do
  code=$(curl -sf -o /dev/null -w "%{http_code}" "$FRONTEND$path")
  [ "$code" = "200" ] || fail "frontend $path returned $code"
  pass "Frontend $path ($code)"
done

if curl -sf "$INDEXER/health" >/dev/null 2>&1; then
  pass "Indexer /health"
else
  echo "  ! Indexer not running on $INDEXER (start with ./start-dev.sh)"
fi

echo ""
echo "All smoke checks passed."
