#!/bin/bash

# Zephyra Smart Contracts - Validation & Deployment Script
# Run from WSL: bash scripts/validate-and-deploy.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Setup PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"

echo -e "${BLUE}"
echo "========================================"
echo "Zephyra Smart Contracts"
echo "Validation & Deployment Script"
echo "========================================"
echo -e "${NC}"

# Step 1: Validate Environment
echo -e "${YELLOW}[1/10] Validating environment...${NC}"
echo ""

echo "Checking Rust..."
if command -v rustc &> /dev/null; then
    echo -e "${GREEN}✓ Rust: $(rustc --version)${NC}"
else
    echo -e "${RED}✗ Rust not found${NC}"
    exit 1
fi

echo "Checking Cargo..."
if command -v cargo &> /dev/null; then
    echo -e "${GREEN}✓ Cargo: $(cargo --version)${NC}"
else
    echo -e "${RED}✗ Cargo not found${NC}"
    exit 1
fi

echo "Checking Solana..."
if command -v solana &> /dev/null; then
    echo -e "${GREEN}✓ Solana: $(solana --version)${NC}"
else
    echo -e "${RED}✗ Solana not found${NC}"
    exit 1
fi

echo "Checking Anchor..."
if command -v anchor &> /dev/null; then
    echo -e "${GREEN}✓ Anchor: $(anchor --version)${NC}"
else
    echo -e "${RED}✗ Anchor not found${NC}"
    exit 1
fi

echo "Checking Node.js..."
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    exit 1
fi

echo ""

# Step 2: Validate Project Structure
echo -e "${YELLOW}[2/10] Validating project structure...${NC}"
echo ""

REQUIRED_FILES=(
    "Anchor.toml"
    "Cargo.toml"
    "package.json"
    "programs/zephyra-protection-manager/Cargo.toml"
    "programs/zephyra-protection-manager/src/lib.rs"
    "programs/zephyra-route-executor/Cargo.toml"
    "programs/zephyra-route-executor/src/lib.rs"
    "programs/zephyra-proof-verifier/Cargo.toml"
    "programs/zephyra-proof-verifier/src/lib.rs"
    "programs/zephyra-batch-coordinator/Cargo.toml"
    "programs/zephyra-batch-coordinator/src/lib.rs"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ $file (missing)${NC}"
        exit 1
    fi
done

echo ""

# Step 3: Validate Cargo.toml files
echo -e "${YELLOW}[3/10] Validating Cargo.toml files...${NC}"
echo ""

for program in programs/*/; do
    program_name=$(basename "$program")
    echo "Checking $program_name..."
    
    if cargo check --manifest-path "${program}Cargo.toml" --quiet 2>&1 | grep -q "error"; then
        echo -e "${RED}✗ $program_name has errors${NC}"
        cargo check --manifest-path "${program}Cargo.toml"
        exit 1
    else
        echo -e "${GREEN}✓ $program_name Cargo.toml is valid${NC}"
    fi
done

echo ""

# Step 4: Validate Anchor.toml
echo -e "${YELLOW}[4/10] Validating Anchor.toml...${NC}"
echo ""

if [ -f "Anchor.toml" ]; then
    echo -e "${GREEN}✓ Anchor.toml exists${NC}"
    
    # Check if all programs are listed
    for program in zephyra_protection_manager zephyra_route_executor zephyra_proof_verifier zephyra_batch_coordinator; do
        if grep -q "$program" Anchor.toml; then
            echo -e "${GREEN}✓ $program configured in Anchor.toml${NC}"
        else
            echo -e "${RED}✗ $program not found in Anchor.toml${NC}"
            exit 1
        fi
    done
else
    echo -e "${RED}✗ Anchor.toml not found${NC}"
    exit 1
fi

echo ""

# Step 5: Configure Solana
echo -e "${YELLOW}[5/10] Configuring Solana...${NC}"
echo ""

solana config set --url https://api.devnet.solana.com
echo -e "${GREEN}✓ Configured to devnet${NC}"

# Check wallet
if [ ! -f ~/.config/solana/id.json ]; then
    echo "Creating new wallet..."
    solana-keygen new --no-bip39-passphrase
    echo -e "${GREEN}✓ Wallet created${NC}"
else
    echo -e "${GREEN}✓ Wallet exists${NC}"
fi

WALLET_ADDRESS=$(solana address)
echo "Wallet Address: $WALLET_ADDRESS"

BALANCE=$(solana balance)
echo "Current Balance: $BALANCE"

# Request airdrop if needed
if [[ "$BALANCE" == "0 SOL" ]] || [[ "$BALANCE" < "2 SOL" ]]; then
    echo "Requesting airdrop..."
    solana airdrop 5 || echo -e "${YELLOW}⚠ Airdrop failed (rate limit). Request manually at https://faucet.solana.com${NC}"
    sleep 5
    BALANCE=$(solana balance)
    echo "New Balance: $BALANCE"
fi

echo ""

# Step 6: Install Dependencies
echo -e "${YELLOW}[6/10] Installing Node.js dependencies...${NC}"
echo ""

npm install --silent
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""

# Step 7: Clean Previous Build
echo -e "${YELLOW}[7/10] Cleaning previous build...${NC}"
echo ""

if [ -d "target" ]; then
    rm -rf target
    echo -e "${GREEN}✓ Cleaned target directory${NC}"
else
    echo -e "${GREEN}✓ No previous build found${NC}"
fi

echo ""

# Step 8: Build Smart Contracts
echo -e "${YELLOW}[8/10] Building smart contracts...${NC}"
echo ""
echo "This may take 5-10 minutes..."
echo ""

if anchor build; then
    echo ""
    echo -e "${GREEN}✓ Build successful!${NC}"
    echo ""
    
    # Show built programs
    echo "Built programs:"
    ls -lh target/deploy/*.so | awk '{print "  " $9 " (" $5 ")"}'
    echo ""
else
    echo ""
    echo -e "${RED}✗ Build failed!${NC}"
    exit 1
fi

# Step 9: Deploy to Devnet
echo -e "${YELLOW}[9/10] Deploying to devnet...${NC}"
echo ""

if anchor deploy --provider.cluster devnet; then
    echo ""
    echo -e "${GREEN}✓ Deployment successful!${NC}"
else
    echo ""
    echo -e "${RED}✗ Deployment failed!${NC}"
    exit 1
fi

echo ""

# Step 10: Get Program IDs and Update Config
echo -e "${YELLOW}[10/10] Finalizing deployment...${NC}"
echo ""

PROTECTION_MANAGER_ID=$(solana address -k target/deploy/zephyra_protection_manager-keypair.json)
ROUTE_EXECUTOR_ID=$(solana address -k target/deploy/zephyra_route_executor-keypair.json)
PROOF_VERIFIER_ID=$(solana address -k target/deploy/zephyra_proof_verifier-keypair.json)
BATCH_COORDINATOR_ID=$(solana address -k target/deploy/zephyra_batch_coordinator-keypair.json)

echo -e "${BLUE}"
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo -e "${NC}"
echo ""
echo "Program IDs:"
echo "  Protection Manager:  $PROTECTION_MANAGER_ID"
echo "  Route Executor:      $ROUTE_EXECUTOR_ID"
echo "  Proof Verifier:      $PROOF_VERIFIER_ID"
echo "  Batch Coordinator:   $BATCH_COORDINATOR_ID"
echo ""

# Update .env file
echo "Updating .env file..."
cat > .env << EOF
# Zephyra Smart Contracts - Deployed Configuration
# Generated: $(date)

# Solana Configuration
SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
WALLET_PRIVATE_KEY=$(cat ~/.config/solana/id.json | base64 -w 0)

# Deployed Program IDs
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

echo -e "${GREEN}✓ .env file updated${NC}"
echo ""

# Show verification links
echo "Verify on Solana Explorer:"
echo "  Protection Manager:"
echo "    https://explorer.solana.com/address/$PROTECTION_MANAGER_ID?cluster=devnet"
echo ""
echo "  Route Executor:"
echo "    https://explorer.solana.com/address/$ROUTE_EXECUTOR_ID?cluster=devnet"
echo ""
echo "  Proof Verifier:"
echo "    https://explorer.solana.com/address/$PROOF_VERIFIER_ID?cluster=devnet"
echo ""
echo "  Batch Coordinator:"
echo "    https://explorer.solana.com/address/$BATCH_COORDINATOR_ID?cluster=devnet"
echo ""

echo -e "${BLUE}"
echo "========================================"
echo "Next Steps:"
echo "========================================"
echo -e "${NC}"
echo "  1. Run tests:"
echo "     anchor test --skip-local-validator"
echo ""
echo "  2. Test MagicBlock integration:"
echo "     npm run example:status"
echo ""
echo "  3. Execute protected swap:"
echo "     npm run example:swap"
echo ""
echo "  4. Run batch execution:"
echo "     npm run example:batch"
echo ""
echo -e "${GREEN}Ready to protect DeFi transactions! 🚀${NC}"
