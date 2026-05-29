#!/usr/bin/env bash
# Build all programs with platform-tools v1.52 (Cargo 1.89, supports edition2024)
# Required because anchor-lang 0.31.1 pulls toml_parser which needs edition2024
set -e

TOOLS=v1.52

echo "Building perp_engine..."
cargo-build-sbf --tools-version $TOOLS --manifest-path programs/perp_engine/Cargo.toml

echo "Building prediction_market..."
cargo-build-sbf --tools-version $TOOLS --manifest-path programs/prediction_market/Cargo.toml

echo "Building cross_margin..."
cargo-build-sbf --tools-version $TOOLS --manifest-path programs/cross_margin/Cargo.toml

echo ""
echo "All programs built successfully."
echo "Run 'anchor deploy' to deploy to localnet/devnet."
