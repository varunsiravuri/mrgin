#!/bin/bash
# Deploy mrgin to devnet
# Prereq: deployer wallet at ~/.config/solana/id.json must have >= 10 SOL
set -e

DEPLOYER=$(solana address)
BALANCE=$(solana balance --lamports | awk '{print $1}')
echo "Deployer: $DEPLOYER"
echo "Balance:  $(solana balance)"

if [ "$BALANCE" -lt 5000000000 ]; then
  echo "ERROR: Need at least 5 SOL. Visit https://faucet.solana.com and airdrop to: $DEPLOYER"
  exit 1
fi

solana config set --url devnet

echo ""
echo "=== Building programs ==="
./build.sh

echo ""
echo "=== Deploying cross_margin ==="
solana program deploy \
  --program-id target/deploy/cross_margin-keypair.json \
  target/deploy/cross_margin.so \
  --url devnet

echo ""
echo "=== Deploying perp_engine ==="
solana program deploy \
  --program-id target/deploy/perp_engine-keypair.json \
  target/deploy/perp_engine.so \
  --url devnet

echo ""
echo "=== Deploying prediction_market ==="
solana program deploy \
  --program-id target/deploy/prediction_market-keypair.json \
  target/deploy/prediction_market.so \
  --url devnet

echo ""
echo "=== Funding bot wallets ==="
solana transfer 1 $(solana-keygen pubkey .keys/bot.json) --allow-unfunded-recipient --url devnet
solana transfer 1 $(solana-keygen pubkey .keys/sequencer.json) --allow-unfunded-recipient --url devnet

echo ""
echo "=== Deploy complete ==="
echo "perp_engine:       FiTnBYBBzxQkfiz63XGcUcPay8Z2E7nE5HXEMLPGjktB"
echo "cross_margin:      2Khz6Ehrexn5Eou1SR72UT1XGyAmv5cmAkqCYT24UDDm"
echo "prediction_market: ARFaBkMfGFG6SNiomKPa3b2DzUe52jHa9jqPX26VukU7"
echo ""
echo "Next: npx tsx scripts/init-market.ts"
