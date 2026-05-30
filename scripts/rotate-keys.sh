#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

KEYS_DIR="$ROOT/.keys"
ARCHIVE="$KEYS_DIR/archive-$(date +%Y%m%d-%H%M%S)"
ENV_FILE="$ROOT/app/.env"
mkdir -p "$ARCHIVE"

echo "==> Rotating sequencer + bot keypairs"
for name in sequencer bot; do
  if [ -f "$KEYS_DIR/$name.json" ]; then
    cp "$KEYS_DIR/$name.json" "$ARCHIVE/$name.json"
    echo "  backed up $name.json → $ARCHIVE/"
  fi
  solana-keygen new -o "$KEYS_DIR/$name.json" --no-bip39-passphrase --force >/dev/null
  echo "  new $name pubkey: $(solana-keygen pubkey "$KEYS_DIR/$name.json")"
done

to_b58() {
  node -e "
const bs58 = require('bs58');
const fs = require('fs');
const secret = Uint8Array.from(JSON.parse(fs.readFileSync('$1', 'utf8')));
process.stdout.write(bs58.encode(secret));
"
}

SEQ_B58=$(to_b58 "$KEYS_DIR/sequencer.json")
BOT_B58=$(to_b58 "$KEYS_DIR/bot.json")

if [ ! -f "$ENV_FILE" ]; then
  cp "$ROOT/app/.env.example" "$ENV_FILE"
fi

set_kv() {
  local key=$1 val=$2
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i '' "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$val" >> "$ENV_FILE"
  fi
}

set_kv "SEQUENCER_SECRET_KEY" "$SEQ_B58"
set_kv "BOT_SECRET_KEY" "$BOT_B58"

echo ""
echo "==> Funding new wallets on devnet"
DEPLOYER=$(solana address)
for key in sequencer bot; do
  PUB=$(solana-keygen pubkey "$KEYS_DIR/$key.json")
  solana airdrop 0.5 "$PUB" --url devnet >/dev/null 2>&1 || \
    solana transfer "$PUB" 0.2 --allow-unfunded-recipient --url devnet || true
  echo "  $key balance: $(solana balance "$PUB" --url devnet)"
done

echo ""
echo "==> Key rotation complete"
echo "  Old keys archived in: $ARCHIVE"
echo "  app/.env updated (SEQUENCER_SECRET_KEY, BOT_SECRET_KEY)"
echo ""
echo "Next: npx tsx scripts/init-market.ts   # binds new sequencer to a devnet market"
