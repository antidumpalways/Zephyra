#!/bin/bash

# Zephyra Build Script - Linux Filesystem WSL
# This script builds from Linux filesystem to avoid symlink issues

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Zephyra Smart Contracts - Linux Build${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Setup PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$HOME/.avm/bin:$PATH"

# Navigate to Linux filesystem project
cd ~/zephyra-contracts

echo -e "${YELLOW}[1/5] Checking environment...${NC}"
echo "Rust: $(rustc --version 2>/dev/null || echo 'Not found')"
echo "Solana: $(solana --version 2>/dev/null || echo 'Not found')"
echo "Anchor: $(anchor --version 2>/dev/null || echo 'Not found')"
echo ""

echo -e "${YELLOW}[2/5] Fixing permissions...${NC}"
chmod -R 755 ~/.local/share/solana 2>/dev/null || true
echo "Permissions fixed"
echo ""

echo -e "${YELLOW}[3/5] Cleaning previous build...${NC}"
rm -rf target
echo "Target directory cleaned"
echo ""

echo -e "${YELLOW}[4/5] Building smart contracts...${NC}"
echo "This will take 5-10 minutes..."
echo ""

if anchor build; then
    echo ""
    echo -e "${GREEN}[5/5] Build successful!${NC}"
    echo ""
    echo "Built programs:"
    ls -lh target/deploy/*.so
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Build Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
else
    echo ""
    echo -e "${YELLOW}Build failed or incomplete${NC}"
    exit 1
fi
