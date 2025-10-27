# Quick Start - Deploy Zephyra Smart Contracts

## Prerequisites (Install These First)

### 1. Install Rust (Required)
```powershell
# Download and run Rust installer
Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "$env:TEMP\rustup-init.exe"
& "$env:TEMP\rustup-init.exe" -y

# Restart PowerShell after installation
```

### 2. Install Solana CLI (Required)
Download from: https://github.com/solana-labs/solana/releases/latest

Or use installer:
```powershell
# Download Solana installer (v1.18.0)
Invoke-WebRequest -Uri "https://release.solana.com/v1.18.0/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "$env:TEMP\solana-install.exe"

# Run installer
& "$env:TEMP\solana-install.exe" v1.18.0

# Add to PATH manually or restart PowerShell
$env:Path += ";$env:USERPROFILE\.local\share\solana\install\active_release\bin"
```

### 3. Install Anchor CLI (Required)
```powershell
# Install Anchor Version Manager
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install latest Anchor
avm install latest
avm use latest

# Restart PowerShell
```

### 4. Verify Installation
```powershell
rustc --version    # Should show rust version
solana --version   # Should show solana-cli version
anchor --version   # Should show anchor-cli version
node --version     # Should show node version
```

## Setup Solana Wallet

```powershell
# Configure Solana to use devnet
solana config set --url https://api.devnet.solana.com

# Create new wallet (or use existing)
solana-keygen new

# Get your wallet address
solana address

# Request airdrop for testing
solana airdrop 5

# Check balance
solana balance
```

## Build & Deploy

### Step 1: Install Dependencies
```powershell
npm install
```

### Step 2: Build Smart Contracts
```powershell
# Build all programs
anchor build

# This will create:
# - target/deploy/*.so (compiled programs)
# - target/idl/*.json (program interfaces)
# - target/deploy/*-keypair.json (program keypairs)
```

### Step 3: Deploy to Devnet
```powershell
# Deploy all programs at once
anchor deploy --provider.cluster devnet

# OR deploy individually:
anchor deploy --program-name zephyra-protection-manager --provider.cluster devnet
anchor deploy --program-name zephyra-route-executor --provider.cluster devnet
anchor deploy --program-name zephyra-proof-verifier --provider.cluster devnet
anchor deploy --program-name zephyra-batch-coordinator --provider.cluster devnet
```

### Step 4: Get Program IDs
```powershell
# After deployment, get the program IDs:
solana address -k target/deploy/zephyra_protection_manager-keypair.json
solana address -k target/deploy/zephyra_route_executor-keypair.json
solana address -k target/deploy/zephyra_proof_verifier-keypair.json
solana address -k target/deploy/zephyra_batch_coordinator-keypair.json
```

### Step 5: Update Configuration
Update `.env` file with your deployed program IDs:
```env
PROTECTION_MANAGER_PROGRAM_ID=<your_program_id>
ROUTE_EXECUTOR_PROGRAM_ID=<your_program_id>
PROOF_VERIFIER_PROGRAM_ID=<your_program_id>
BATCH_COORDINATOR_PROGRAM_ID=<your_program_id>
```

## Test Deployment

### Run Tests
```powershell
# Run all tests
anchor test --skip-local-validator

# Or run specific test
npm test tests/zephyra-protection-manager.ts
```

### Run Examples
```powershell
# Check MagicBlock network status
npm run example:status

# Execute protected swap
npm run example:swap

# Run batch execution
npm run example:batch
```

## Verify on Explorer

Visit Solana Explorer to verify deployment:
```
https://explorer.solana.com/address/<YOUR_PROGRAM_ID>?cluster=devnet
```

## Troubleshooting

### Issue: "solana: command not found"
**Solution**: Restart PowerShell or add Solana to PATH manually:
```powershell
$env:Path += ";$env:USERPROFILE\.local\share\solana\install\active_release\bin"
```

### Issue: "Insufficient balance"
**Solution**: Request more SOL from faucet:
```powershell
solana airdrop 5
# Or visit: https://faucet.solana.com
```

### Issue: "Build failed"
**Solution**: Clean and rebuild:
```powershell
Remove-Item -Recurse -Force target
anchor build
```

### Issue: "Deployment failed"
**Solution**: Check your balance and retry:
```powershell
solana balance  # Should have at least 5 SOL
solana airdrop 5
anchor deploy --provider.cluster devnet
```

## Cost Estimate

Deploying all 4 programs requires approximately:
- **5-10 SOL** for deployment (devnet - free from faucet)
- **1-2 SOL** for testing

## Next Steps After Deployment

1. ✅ Update `.env` with program IDs
2. ✅ Run tests to verify deployment
3. ✅ Test MagicBlock integration
4. ✅ Monitor performance metrics
5. ✅ Prepare for mainnet deployment

## Quick Commands Reference

```powershell
# Check Solana config
solana config get

# Check balance
solana balance

# Request airdrop
solana airdrop 5

# Build contracts
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test

# Run examples
npm run example:status
npm run example:swap
npm run example:batch

# View logs
solana logs <SIGNATURE>

# Check program
solana program show <PROGRAM_ID>
```

---

**Ready to deploy! Follow these steps and you'll have your smart contracts live on Solana devnet.** 🚀


