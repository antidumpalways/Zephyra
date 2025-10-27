#!/bin/bash

# Zephyra Smart Contracts - WSL Deployment Script
# Run this script from WSL: bash scripts/deploy-wsl.sh

set -e

echo "========================================"
echo "Zephyra Smart Contracts Deployment (WSL)"
echo "========================================"
echo ""

# Setup PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[1/8] Checking installations...${NC}"
echo "Rust version: $(rustc --version)"
echo "Cargo version: $(cargo --version)"
echo "Solana version: $(solana --version)"
echo "Anchor version: $(anchor --version)"
echo "Node version: $(node --version)"
echo ""

echo -e "${YELLOW}[2/8] Configuring Solana for devnet...${NC}"
solana config set --url https://api.devnet.solana.com
echo -e "${GREEN}[OK] Configured to devnet${NC}"
echo ""

echo -e "${YELLOW}[3/8] Checking wallet...${NC}"
if [ ! -f ~/.config/solana/id.json ]; then
    echo "Creating new wallet..."
    solana-keygen new --no-bip39-passphrase
    echo -e "${GREEN}[OK] Wallet created${NC}"
else
    echo -e "${GREEN}[OK] Wallet exists${NC}"
fi

WALLET_ADDRESS=$(solana address)
echo "Wallet Address: $WALLET_ADDRESS"
echo ""

echo -e "${YELLOW}[4/8] Checking balance...${NC}"
BALANCE=$(solana balance)
echo "Current Balance: $BALANCE"

# Request airdrop if balance is low
if [[ "$BALANCE" == "0 SOL" ]]; then
    echo "Requesting airdrop..."
    solana airdrop 5 || echo -e "${YELLOW}[WARNING] Airdrop failed (rate limit). Request manually at https://faucet.solana.com${NC}"
    sleep 5
    BALANCE=$(solana balance)
    echo "New Balance: $BALANCE"
fi
echo ""

echo -e "${YELLOW}[5/8] Installing Node.js dependencies...${NC}"
npm install
echo -e "${GREEN}[OK] Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}[6/8] Building smart contracts...${NC}"
echo "This may take 5-10 minutes..."
anchor build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK] Build successful!${NC}"
else
    echo -e "${RED}[ERROR] Build failed!${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}[7/8] Deploying to devnet...${NC}"
echo "This will deploy all 4 programs..."
anchor deploy --provider.cluster devnet

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK] Deployment successful!${NC}"
else
    echo -e "${RED}[ERROR] Deployment failed!${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}[8/8] Getting Program IDs...${NC}"
echo ""
echo "========================================" 
echo "Deployed Program IDs:"
echo "========================================"
echo ""

PROTECTION_MANAGER_ID=$(solana address -k target/deploy/zephyra_protection_manager-keypair.json)
ROUTE_EXECUTOR_ID=$(solana address -k target/deploy/zephyra_route_executor-keypair.json)
PROOF_VERIFIER_ID=$(solana address -k target/deploy/zephyra_proof_verifier-keypair.json)
BATCH_COORDINATOR_ID=$(solana address -k target/deploy/zephyra_batch_coordinator-keypair.json)

echo "Protection Manager: $PROTECTION_MANAGER_ID"
echo "Route Executor:     $ROUTE_EXECUTOR_ID"
echo "Proof Verifier:     $PROOF_VERIFIER_ID"
echo "Batch Coordinator:  $BATCH_COORDINATOR_ID"
echo ""

echo "========================================" 
echo "Updating .env file..."
echo "========================================"

# Update .env file
cat > .env << EOF
# Zephyra Smart Contracts Environment Configuration
# Updated: $(date)

# Solana Configuration
SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
WALLET_PRIVATE_KEY=$(cat ~/.config/solana/id.json | base64 -w 0)

# Program IDs (Deployed)
PROTECTION_MANAGER_PROGRAM_ID=$PROTECTION_MANAGER_ID
ROUTE_EXECUTOR_PROGRAM_ID=$ROUTE_EXECUTOR_ID
PROOF_VERIFIER_PROGRAM_ID=$PROOF_VERIFIER_ID
BATCH_COORDINATOR_PROGRAM_ID=$BATCH_COORDINATOR_ID

# MagicBlock Configuration
MAGICBLOCK_RPC_URL=https://devnet-router.magicblock.app
MAGICBLOCK_API_KEY=your_magicblock_api_key_here
MAGICBLOCK_CHAIN_ID=magicblock-devnet

# DEX Program IDs
JUPITER_PROGRAM_ID=JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4
RAYDIUM_PROGRAM_ID=675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8
ORCA_PROGRAM_ID=9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP

# Fee Configuration
PROTECTION_FEE_BPS=10
BATCH_COORDINATION_FEE_BPS=5
MAX_SLIPPAGE_BPS=100
MAX_MEV_RISK_SCORE=50

# Batch Configuration
MAX_BATCH_SIZE=5
BATCH_TIME_THRESHOLD=30000
MIN_BATCH_AGE_SECONDS=30

# Rollup Configuration
ROLLUP_SESSION_TIMEOUT=300
MAX_INSTRUCTIONS_PER_SESSION=100
EOF

echo -e "${GREEN}[OK] .env file updated${NC}"
echo ""

echo "========================================" 
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "Next Steps:"
echo "  1. Run tests: anchor test"
echo "  2. Run examples: npm run example:status"
echo "  3. Verify on explorer:"
echo "     https://explorer.solana.com/address/$PROTECTION_MANAGER_ID?cluster=devnet"
echo ""
echo "Ready to protect DeFi transactions! 🚀"
