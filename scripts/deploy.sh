#!/bin/bash

# Zephyra Smart Contracts Deployment Script
# Deploys all 4 programs to Solana devnet/mainnet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLUSTER=${1:-devnet} # devnet or mainnet-beta
PROGRAMS=(
    "zephyra-protection-manager"
    "zephyra-route-executor"
    "zephyra-proof-verifier"
    "zephyra-batch-coordinator"
)

echo -e "${BLUE}🚀 Zephyra Smart Contracts Deployment${NC}"
echo -e "${BLUE}Target Cluster: ${CLUSTER}${NC}"
echo ""

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ Anchor CLI not found. Please install Anchor first.${NC}"
    echo "Run: npm install -g @coral-xyz/anchor-cli"
    exit 1
fi

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI not found. Please install Solana CLI first.${NC}"
    exit 1
fi

# Set cluster
echo -e "${YELLOW}📡 Setting cluster to ${CLUSTER}...${NC}"
solana config set --url https://api.${CLUSTER}.solana.com

# Check wallet balance
echo -e "${YELLOW}💰 Checking wallet balance...${NC}"
BALANCE=$(solana balance --lamports)
echo "Current balance: $(($BALANCE / 1000000000)) SOL"

if [ $BALANCE -lt 5000000000 ]; then
    echo -e "${RED}❌ Insufficient balance. Need at least 5 SOL for deployment.${NC}"
    echo "Run: solana airdrop 5"
    exit 1
fi

# Build all programs
echo -e "${YELLOW}🔨 Building all programs...${NC}"
anchor build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Deploy programs
echo -e "${YELLOW}🚀 Deploying programs...${NC}"

for program in "${PROGRAMS[@]}"; do
    echo -e "${BLUE}Deploying ${program}...${NC}"
    
    # Deploy the program
    anchor deploy --program-name ${program}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${program} deployed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to deploy ${program}${NC}"
        exit 1
    fi
done

echo ""
echo -e "${GREEN}🎉 All programs deployed successfully!${NC}"
echo ""

# Display program IDs
echo -e "${BLUE}📋 Program IDs:${NC}"
for program in "${PROGRAMS[@]}"; do
    PROGRAM_ID=$(solana address -k target/deploy/${program}_keypair.json)
    echo "${program}: ${PROGRAM_ID}"
done

echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Update Anchor.toml with the deployed program IDs"
echo "2. Update backend environment variables"
echo "3. Run tests to verify deployment"
echo "4. Configure MagicBlock integration"

echo ""
echo -e "${BLUE}🔗 Useful Commands:${NC}"
echo "Check program: solana program show <PROGRAM_ID>"
echo "View logs: solana logs <PROGRAM_ID>"
echo "Test deployment: anchor test"


