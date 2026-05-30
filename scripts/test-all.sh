#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Sync IDL TypeScript types"
mkdir -p target/types
anchor idl type target/idl/cross_margin.json -o target/types/cross_margin.ts
anchor idl type target/idl/perp_engine.json -o target/types/perp_engine.ts
anchor idl type target/idl/prediction_market.json -o target/types/prediction_market.ts

echo "==> Build Solana programs"
bash build.sh

echo "==> Anchor integration tests"
anchor test --skip-build

echo "==> Frontend unit tests"
cd frontend && npm test && npm run build && cd ..

echo "==> Backend typecheck"
cd app/api && npx tsc --noEmit && cd ../..
cd app/matching-engine && npx tsc --noEmit && cd ../..
cd app/bots && npx tsc --noEmit && cd ../..
cd app/indexer && npx tsc --noEmit && cd ../..

echo ""
echo "All tests passed."
