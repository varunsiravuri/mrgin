#!/usr/bin/env bash
# Seed mark price + market stats in Redis (run after deploy or market init).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/app/.env}"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

REDIS_CLI="${REDIS_CLI:-redis-cli}"
MARKET="${1:-${MARKET_ADDRESSES%%,*}}"

if [ -z "$MARKET" ]; then
  echo "Usage: MARKET_ADDRESSES=... $0 [market_pubkey]"
  echo "Or set MARKET_ADDRESSES in app/.env"
  exit 1
fi

# Default mark $100 (8-decimal fixed point, same as dev stack)
"$REDIS_CLI" SET "price:${MARKET}" 100000000 >/dev/null
"$REDIS_CLI" SET "stats:${MARKET}" '{"symbol":"SOL-PERP","openInterest":0,"fundingRate":0}' >/dev/null
echo "Redis seeded for market ${MARKET} (mark=\$100)"
