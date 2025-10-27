# 🚀 Manual Installation Guide - Solana & Anchor for Windows

## ⚠️ Important Notice

Untuk Windows, instalasi Solana dan Anchor memerlukan beberapa langkah manual. Ikuti panduan ini dengan teliti.

## Step 1: Install Solana CLI

### Option A: Download Installer (RECOMMENDED)

1. **Download Solana Installer:**
   - Buka browser dan kunjungi: https://github.com/solana-labs/solana/releases/latest
   - Cari file: `solana-install-init-x86_64-pc-windows-msvc.exe`
   - Download file tersebut

2. **Run Installer:**
   ```powershell
   # Jalankan file yang sudah didownload
   # Atau jika sudah di Downloads folder:
   & "$env:USERPROFILE\Downloads\solana-install-init-x86_64-pc-windows-msvc.exe" v1.18.0
   ```

3. **Add to PATH:**
   ```powershell
   # Add Solana to PATH
   $solanaPath = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
   $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
   [Environment]::SetEnvironmentVariable("Path", "$currentPath;$solanaPath", "User")
   
   # Reload PATH in current session
   $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
   ```

4. **Verify Installation:**
   ```powershell
   # Restart PowerShell, then:
   solana --version
   ```

### Option B: Using Chocolatey (If you have Chocolatey)

```powershell
choco install solana
```

### Option C: Using WSL (Windows Subsystem for Linux)

Jika Anda punya WSL, instalasi lebih mudah:
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

## Step 2: Setup Solana Wallet

```powershell
# Set cluster to devnet
solana config set --url https://api.devnet.solana.com

# Create new wallet
solana-keygen new --outfile ~/.config/solana/id.json

# Get wallet address
solana address

# Request airdrop
solana airdrop 5

# Check balance
solana balance
```

## Step 3: Install Anchor CLI

```powershell
# Install Anchor Version Manager
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# This will take 10-15 minutes...
# Wait until it completes

# Install latest Anchor
avm install latest
avm use latest

# Verify
anchor --version
```

## Step 4: Build & Deploy

```powershell
# Install Node.js dependencies
npm install

# Build smart contracts
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## 🎯 Alternative: Use Pre-built Docker Container

Jika instalasi terlalu rumit, Anda bisa gunakan Docker:

```powershell
# Pull Solana development image
docker pull projectserum/build:v0.27.0

# Run container
docker run -it -v ${PWD}:/workdir projectserum/build:v0.27.0 bash

# Inside container:
cd /workdir
anchor build
anchor deploy --provider.cluster devnet
```

## 🔧 Troubleshooting

### Issue: "solana: command not found" after installation

**Solution 1:** Restart PowerShell completely (close and reopen)

**Solution 2:** Manually add to PATH:
```powershell
$env:Path += ";$env:USERPROFILE\.local\share\solana\install\active_release\bin"
```

**Solution 3:** Check if Solana is installed:
```powershell
Test-Path "$env:USERPROFILE\.local\share\solana\install\active_release\bin\solana.exe"
```

### Issue: Cargo install takes too long

**Solution:** This is normal. Anchor installation can take 10-20 minutes. Be patient.

### Issue: Network timeout during download

**Solution:** Use VPN or try different network

## 📝 Quick Commands After Installation

```powershell
# Check all installations
rustc --version
cargo --version
solana --version
anchor --version
node --version

# Setup Solana
solana config set --url https://api.devnet.solana.com
solana-keygen new
solana airdrop 5

# Build & Deploy
npm install
anchor build
anchor deploy --provider.cluster devnet
```

## 🎯 Expected Output After Successful Deployment

```
Deploying workspace: https://api.devnet.solana.com
Upgrade authority: ~/.config/solana/id.json

Deploying program "zephyra-protection-manager"...
Program Id: Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS

Deploying program "zephyra-route-executor"...
Program Id: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM

Deploying program "zephyra-proof-verifier"...
Program Id: Cw8CFyM9FkoMi7KTYpkqXZ4e4v5X3sJ7W8dL2mN9pQrT

Deploying program "zephyra-batch-coordinator"...
Program Id: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

Deploy success
```

## 🆘 Need Help?

Jika masih mengalami kesulitan, Anda bisa:

1. **Use Solana Playground (Online IDE):**
   - Visit: https://beta.solpg.io/
   - Upload your programs
   - Build and deploy from browser

2. **Use Replit:**
   - Import project to Replit
   - Use built-in Solana tools

3. **Contact Support:**
   - Solana Discord: https://discord.gg/solana
   - Anchor Discord: https://discord.gg/anchor

---

## 📋 Checklist

- [ ] Rust installed (`rustc --version`)
- [ ] Cargo installed (`cargo --version`)
- [ ] Solana CLI installed (`solana --version`)
- [ ] Anchor CLI installed (`anchor --version`)
- [ ] Node.js installed (`node --version`)
- [ ] Wallet created (`solana-keygen new`)
- [ ] Devnet configured (`solana config set --url https://api.devnet.solana.com`)
- [ ] SOL airdropped (`solana airdrop 5`)
- [ ] Dependencies installed (`npm install`)
- [ ] Programs built (`anchor build`)
- [ ] Programs deployed (`anchor deploy`)

---

**Setelah semua terinstall, kembali ke sini dan kita lanjutkan deployment!** 🚀


