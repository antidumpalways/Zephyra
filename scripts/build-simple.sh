#!/bin/bash

# Simple build script for WSL
export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$HOME/.avm/bin:$PATH"

echo "Building Zephyra Smart Contracts..."
echo "This will take 5-10 minutes..."
echo ""

cd /mnt/c/Users/Antidump/CypherpunkMagic

# Build
anchor build

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Build successful!"
    echo ""
    echo "Built programs:"
    ls -lh target/deploy/*.so
    echo ""
else
    echo ""
    echo "✗ Build failed!"
    exit 1
fi
