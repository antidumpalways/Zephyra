#!/bin/bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$HOME/.avm/bin:$PATH"
cd /mnt/c/Users/Antidump/CypherpunkMagic
echo "========================================" 
echo "Building Zephyra Smart Contracts"
echo "========================================"
echo ""
anchor build
echo ""
echo "Build completed!"
ls -lh target/deploy/*.so 2>/dev/null || echo "No .so files found"
