#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="$ROOT/app/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE — copy app/.env.example first"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

API_KEY="${HELIUS_API_KEY:-}"
if [ -z "$API_KEY" ] && [[ "${HELIUS_RPC:-}" == *"api-key="* ]]; then
  API_KEY=$(echo "$HELIUS_RPC" | sed -n 's/.*api-key=\([^&]*\).*/\1/p')
fi
if [ -z "$API_KEY" ]; then
  echo "Set HELIUS_API_KEY or HELIUS_RPC with ?api-key=..."
  exit 1
fi

INDEXER_PORT="${INDEXER_PORT:-3002}"
PERP="${PERP_ENGINE_PROGRAM_ID:-FiTnBYBBzxQkfiz63XGcUcPay8Z2E7nE5HXEMLPGjktB}"
CROSS="${CROSS_MARGIN_PROGRAM_ID:-2Khz6Ehrexn5Eou1SR72UT1XGyAmv5cmAkqCYT24UDDm}"
PRED="${PREDICTION_MARKET_PROGRAM_ID:-ARFaBkMfGFG6SNiomKPa3b2DzUe52jHa9jqPX26VukU7}"
MARKET="${MARKET_ADDRESSES:-FG2Ggfmyxt6LfzHXXZbBfMy35Z2HaKuBQFA8o3aCBPZQ}"

if ! curl -sf "http://127.0.0.1:${INDEXER_PORT}/health" >/dev/null; then
  echo "Starting indexer on port ${INDEXER_PORT}..."
  (cd "$ROOT/app" && npx tsx indexer/src/index.ts) &
  sleep 2
fi
curl -sf "http://127.0.0.1:${INDEXER_PORT}/health" >/dev/null || { echo "Indexer failed to start"; exit 1; }
echo "Indexer healthy on :${INDEXER_PORT}"

WEBHOOK_PUBLIC_URL="${WEBHOOK_PUBLIC_URL:-}"
CF_PID=""
if [ -z "$WEBHOOK_PUBLIC_URL" ]; then
  if ! command -v cloudflared >/dev/null; then
    echo "Installing cloudflared..."
    brew install cloudflared
  fi
  CF_LOG="/tmp/mrgin-cloudflared.log"
  : > "$CF_LOG"
  cloudflared tunnel --url "http://127.0.0.1:${INDEXER_PORT}" >>"$CF_LOG" 2>&1 &
  CF_PID=$!
  for _ in $(seq 1 45); do
    WEBHOOK_PUBLIC_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$CF_LOG" | head -1 || true)
    [ -n "$WEBHOOK_PUBLIC_URL" ] && break
    sleep 1
  done
  if [ -z "$WEBHOOK_PUBLIC_URL" ]; then
    echo "Could not obtain cloudflared URL — set WEBHOOK_PUBLIC_URL manually"
    [ -n "$CF_PID" ] && kill "$CF_PID" 2>/dev/null || true
    exit 1
  fi
  echo "Tunnel: $WEBHOOK_PUBLIC_URL"
fi

WEBHOOK_URL="${WEBHOOK_PUBLIC_URL%/}/webhook"
AUTH="${HELIUS_WEBHOOK_AUTH:-mrgin-dev-webhook-$(openssl rand -hex 8)}"

ADDRESSES=$(printf '%s\n' "$PERP" "$CROSS" "$PRED" "$MARKET" | jq -R . | jq -s .)

PAYLOAD=$(jq -n \
  --arg url "$WEBHOOK_URL" \
  --arg auth "$AUTH" \
  --argjson accounts "$ADDRESSES" \
  '{
    webhookURL: $url,
    transactionTypes: ["ANY"],
    accountAddresses: $accounts,
    webhookType: "enhancedDevnet",
    authHeader: $auth
  }')

echo "Registering Helius webhook → $WEBHOOK_URL"
RESP=$(curl -sf -X POST "https://api.helius.xyz/v0/webhooks?api-key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD") || { echo "Helius webhook create failed"; exit 1; }

WEBHOOK_ID=$(echo "$RESP" | jq -r '.webhookID // empty')
echo "$RESP" | jq .

if [ -n "$WEBHOOK_ID" ]; then
  grep -q '^HELIUS_WEBHOOK_ID=' "$ENV_FILE" 2>/dev/null && \
    sed -i '' "s|^HELIUS_WEBHOOK_ID=.*|HELIUS_WEBHOOK_ID=${WEBHOOK_ID}|" "$ENV_FILE" || \
    printf '\nHELIUS_WEBHOOK_ID=%s\n' "$WEBHOOK_ID" >> "$ENV_FILE"
  grep -q '^HELIUS_WEBHOOK_AUTH=' "$ENV_FILE" 2>/dev/null && \
    sed -i '' "s|^HELIUS_WEBHOOK_AUTH=.*|HELIUS_WEBHOOK_AUTH=${AUTH}|" "$ENV_FILE" || \
    printf 'HELIUS_WEBHOOK_AUTH=%s\n' "$AUTH" >> "$ENV_FILE"
  grep -q '^WEBHOOK_PUBLIC_URL=' "$ENV_FILE" 2>/dev/null && \
    sed -i '' "s|^WEBHOOK_PUBLIC_URL=.*|WEBHOOK_PUBLIC_URL=${WEBHOOK_PUBLIC_URL}|" "$ENV_FILE" || \
    printf 'WEBHOOK_PUBLIC_URL=%s\n' "$WEBHOOK_PUBLIC_URL" >> "$ENV_FILE"
  echo ""
  echo "Saved HELIUS_WEBHOOK_ID, HELIUS_WEBHOOK_AUTH, WEBHOOK_PUBLIC_URL to app/.env"
  echo "Restart indexer so it picks up HELIUS_WEBHOOK_AUTH."
fi

if [ -n "$CF_PID" ]; then
  echo ""
  echo "cloudflared running (pid $CF_PID) — keep this terminal open or run cloudflared in production."
fi
