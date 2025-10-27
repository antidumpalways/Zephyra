#!/bin/bash

# Zephyra Contracts Build & Deploy Script
# For WSL without Docker

set -e

echo "🔨 Building Zephyra Smart Contracts for Solana..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DEPLOY_DIR="target/deploy"
mkdir -p $DEPLOY_DIR

echo -e "${BLUE}Building all programs...${NC}"

# Build each program in release mode
cargo build --release

echo -e "${GREEN}✓ Build complete!${NC}"

# Copy to deploy directory with proper names
echo -e "${BLUE}Preparing deployment artifacts...${NC}"

cp target/release/libzephyra_protection_manager.so $DEPLOY_DIR/zephyra_protection_manager.so
cp target/release/libzephyra_route_executor.so $DEPLOY_DIR/zephyra_route_executor.so
cp target/release/libzephyra_proof_verifier.so $DEPLOY_DIR/zephyra_proof_verifier.so
cp target/release/libzephyra_batch_coordinator.so $DEPLOY_DIR/zephyra_batch_coordinator.so

echo -e "${GREEN}✓ Deployment files ready!${NC}"

# Generate program keypairs if not exist
echo -e "${BLUE}Generating program keypairs...${NC}"

for program in zephyra_protection_manager zephyra_route_executor zephyra_proof_verifier zephyra_batch_coordinator; do
    if [ ! -f "$DEPLOY_DIR/${program}-keypair.json" ]; then
        solana-keygen new --no-bip39-passphrase -o "$DEPLOY_DIR/${program}-keypair.json" --force
    fi
done

echo -e "${GREEN}✓ Keypairs ready!${NC}"

# Check balance
echo -e "${BLUE}Checking wallet balance...${NC}"
BALANCE=$(solana balance)
echo "Balance: $BALANCE"

# Ask for confirmation
echo ""
echo -e "${RED}⚠️  WARNING: Release builds (.so) may not work for deployment.${NC}"
echo -e "${RED}   Need proper BPF compilation with cargo-build-sbf${NC}"
echo ""
echo "Programs to deploy:"
ls -lh $DEPLOY_DIR/*.so

echo ""
echo -e "${BLUE}Do you want to try deployment? (y/n)${NC}"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Starting deployment...${NC}"
    
    # Try deploying (will likely fail with ELF error)
    anchor deploy --provider.cluster devnet
else
    echo "Deployment cancelled."
    echo ""
    echo "To build properly, you need to:"
    echo "1. Install Docker in WSL: sudo apt install docker.io"
    echo "2. Start Docker: sudo service docker start"
    echo "3. Run: anchor build"
fi

