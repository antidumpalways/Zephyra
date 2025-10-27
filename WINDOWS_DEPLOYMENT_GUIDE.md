# Zephyra Smart Contracts - Windows Installation & Deployment Guide

## Prerequisites Installation

### 1. Install Rust

Download and install Rust from: https://rustup.rs/

Or run in PowerShell:
```powershell
# Download rustup installer
Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "rustup-init.exe"

# Run installer
.\rustup-init.exe
```

After installation, restart your terminal and verify:
```powershell
rustc --version
cargo --version
```

### 2. Install Solana CLI

For Windows, download the installer from: https://github.com/solana-labs/solana/releases

Or use the install script:
```powershell
# Download Solana installer
cmd /c "curl https://release.solana.com/v1.18.0/solana-install-init-x86_64-pc-windows-msvc.exe --output C:\solana-install-tmp\solana-install-init.exe --create-dirs"

# Run installer
C:\solana-install-tmp\solana-install-init.exe v1.18.0
```

Add Solana to PATH:
```powershell
# Add to PATH (run as Administrator)
$env:Path += ";C:\Users\$env:USERNAME\.local\share\solana\install\active_release\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [EnvironmentVariableTarget]::User)
```

Verify installation:
```powershell
solana --version
```

### 3. Install Anchor CLI

```powershell
# Install Anchor via Cargo
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install Anchor version manager
avm install latest
avm use latest
```

Verify installation:
```powershell
anchor --version
```

### 4. Install Node.js Dependencies

```powershell
npm install
```

## Configuration

### 1. Setup Solana Wallet

```powershell
# Generate new keypair (or use existing)
solana-keygen new --outfile ~/.config/solana/id.json

# Set cluster to devnet
solana config set --url https://api.devnet.solana.com

# Check configuration
solana config get

# Get your wallet address
solana address

# Request airdrop (for devnet testing)
solana airdrop 5
```

### 2. Configure Environment

Copy the environment file:
```powershell
Copy-Item env.example .env
```

Update `.env` with your wallet information:
```env
SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
WALLET_PRIVATE_KEY=your_wallet_private_key_here

# MagicBlock Configuration
MAGICBLOCK_RPC_URL=https://devnet-router.magicblock.app
```

## Build Smart Contracts

### 1. Build All Programs

```powershell
# Build all programs
anchor build
```

This will:
- Compile all 4 Rust programs
- Generate IDL files
- Create program keypairs in `target/deploy/`

### 2. Verify Build

```powershell
# Check compiled programs
Get-ChildItem target\deploy\*.so

# Should show:
# - zephyra_protection_manager.so
# - zephyra_route_executor.so
# - zephyra_proof_verifier.so
# - zephyra_batch_coordinator.so
```

## Deploy to Devnet

### Option 1: Deploy All Programs (Automated)

```powershell
# Make sure you have enough SOL
solana balance

# If balance is low, request airdrop
solana airdrop 5

# Deploy all programs
anchor deploy --provider.cluster devnet
```

### Option 2: Deploy Individual Programs

```powershell
# Deploy Protection Manager
anchor deploy --program-name zephyra-protection-manager --provider.cluster devnet

# Deploy Route Executor
anchor deploy --program-name zephyra-route-executor --provider.cluster devnet

# Deploy Proof Verifier
anchor deploy --program-name zephyra-proof-verifier --provider.cluster devnet

# Deploy Batch Coordinator
anchor deploy --program-name zephyra-batch-coordinator --provider.cluster devnet
```

### 3. Get Program IDs

After deployment, get the program IDs:

```powershell
# Protection Manager
solana address -k target\deploy\zephyra_protection_manager-keypair.json

# Route Executor
solana address -k target\deploy\zephyra_route_executor-keypair.json

# Proof Verifier
solana address -k target\deploy\zephyra_proof_verifier-keypair.json

# Batch Coordinator
solana address -k target\deploy\zephyra_batch_coordinator-keypair.json
```

### 4. Update Configuration

Update `Anchor.toml` and `.env` with the deployed program IDs.

## Testing

### 1. Run Unit Tests

```powershell
# Run all tests
anchor test --skip-local-validator

# Or test with local validator
anchor test
```

### 2. Run Integration Tests

```powershell
# Test Protection Manager
npm test tests/zephyra-protection-manager.ts

# Test Route Executor
npm test tests/zephyra-route-executor.ts

# Test Proof Verifier
npm test tests/zephyra-proof-verifier.ts

# Test Batch Coordinator
npm test tests/zephyra-batch-coordinator.ts
```

### 3. Run MagicBlock Examples

```powershell
# Check network status
npm run example:status

# Execute protected swap
npm run example:swap

# Run batch execution
npm run example:batch
```

## Verify Deployment

### 1. Check Program Status

```powershell
# Check if program is deployed
solana program show <PROGRAM_ID>

# Example:
solana program show Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
```

### 2. View on Solana Explorer

Visit: `https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet`

### 3. Test Program Interaction

```powershell
# Run example to test interaction
npm run example:swap
```

## Troubleshooting

### Issue: Insufficient Balance

```powershell
# Check balance
solana balance

# Request more SOL (devnet only)
solana airdrop 5

# Or use faucet: https://faucet.solana.com
```

### Issue: Build Failed

```powershell
# Clean build artifacts
Remove-Item -Recurse -Force target

# Rebuild
anchor build
```

### Issue: Deployment Failed

```powershell
# Check Solana cluster status
solana cluster-version

# Try different RPC endpoint
solana config set --url https://api.devnet.solana.com

# Retry deployment
anchor deploy --provider.cluster devnet
```

### Issue: Program Already Deployed

If you need to upgrade:

```powershell
# Upgrade program
anchor upgrade target/deploy/zephyra_protection_manager.so --program-id <PROGRAM_ID>
```

## Cost Estimation

Deploying all 4 programs to devnet requires approximately:
- **~5-10 SOL** for deployment
- **~1 SOL** for testing

Use devnet faucet to get free SOL for testing.

## Next Steps After Deployment

1. **Update Environment Variables**
   - Copy deployed program IDs to `.env`
   - Update `Anchor.toml` with correct IDs

2. **Test Integration**
   - Run example scripts
   - Verify MagicBlock integration
   - Check transaction execution

3. **Monitor Performance**
   - Check execution times
   - Verify sub-100ms target
   - Monitor MEV protection

4. **Prepare for Mainnet**
   - Security audit
   - Load testing
   - Documentation review

## Useful Commands

```powershell
# Check Solana config
solana config get

# Check wallet balance
solana balance

# Get wallet address
solana address

# View transaction logs
solana logs <SIGNATURE>

# Check program account
solana program show <PROGRAM_ID>

# List deployed programs
Get-ChildItem target\deploy\*-keypair.json
```

## Support

If you encounter issues:

1. Check Solana status: https://status.solana.com
2. Review Anchor docs: https://www.anchor-lang.com
3. Check MagicBlock docs: https://docs.magicblock.gg
4. Review error logs in terminal

---

**Ready to deploy! Follow the steps above to get your smart contracts on Solana devnet.** 🚀


