# Zephyra Smart Contracts - Windows Installation Script
# Run this script in PowerShell as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Zephyra Smart Contracts Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[WARNING] Please run this script as Administrator" -ForegroundColor Yellow
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# 1. Check Rust Installation
Write-Host "[1/8] Checking Rust installation..." -ForegroundColor Yellow
if (Test-Command rustc) {
    $rustVersion = rustc --version
    Write-Host "[OK] Rust is installed: $rustVersion" -ForegroundColor Green
} else {
    Write-Host "[INSTALL] Rust is not installed" -ForegroundColor Red
    Write-Host "Installing Rust..." -ForegroundColor Yellow
    
    # Download and install Rust
    $rustupUrl = "https://win.rustup.rs/x86_64"
    $rustupPath = "$env:TEMP\rustup-init.exe"
    
    Write-Host "Downloading Rust installer..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $rustupUrl -OutFile $rustupPath
    
    Write-Host "Running Rust installer..." -ForegroundColor Yellow
    Start-Process -FilePath $rustupPath -ArgumentList "-y" -Wait
    
    # Refresh environment
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Host "[OK] Rust installed successfully" -ForegroundColor Green
}

Write-Host ""

# 2. Check Solana CLI Installation
Write-Host "[2/8] Checking Solana CLI installation..." -ForegroundColor Yellow
if (Test-Command solana) {
    $solanaVersion = solana --version
    Write-Host "[OK] Solana CLI is installed: $solanaVersion" -ForegroundColor Green
} else {
    Write-Host "[INSTALL] Solana CLI is not installed" -ForegroundColor Red
    Write-Host "Please install Solana CLI manually:" -ForegroundColor Yellow
    Write-Host "Visit: https://docs.solana.com/cli/install-solana-cli-tools" -ForegroundColor Cyan
    Write-Host "Or download from: https://github.com/solana-labs/solana/releases" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 3. Check Anchor CLI Installation
Write-Host "[3/8] Checking Anchor CLI installation..." -ForegroundColor Yellow
if (Test-Command anchor) {
    $anchorVersion = anchor --version
    Write-Host "[OK] Anchor CLI is installed: $anchorVersion" -ForegroundColor Green
} else {
    Write-Host "[INSTALL] Anchor CLI is not installed" -ForegroundColor Red
    Write-Host "Installing Anchor CLI (this may take 10-15 minutes)..." -ForegroundColor Yellow
    
    # Install Anchor via Cargo
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    
    if ($LASTEXITCODE -eq 0) {
        # Install latest Anchor version
        avm install latest
        avm use latest
        Write-Host "[OK] Anchor CLI installed successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to install Anchor CLI" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# 4. Check Node.js Installation
Write-Host "[4/8] Checking Node.js installation..." -ForegroundColor Yellow
if (Test-Command node) {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js is installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Download the LTS version and run the installer" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 5. Install Node.js Dependencies
Write-Host "[5/8] Installing Node.js dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Node.js dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to install Node.js dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 6. Setup Solana Configuration
Write-Host "[6/8] Setting up Solana configuration..." -ForegroundColor Yellow

# Set cluster to devnet
solana config set --url https://api.devnet.solana.com

# Check if wallet exists
$walletPath = "$env:USERPROFILE\.config\solana\id.json"
if (Test-Path $walletPath) {
    Write-Host "[OK] Wallet already exists" -ForegroundColor Green
} else {
    Write-Host "Creating new wallet..." -ForegroundColor Yellow
    solana-keygen new --outfile $walletPath --no-bip39-passphrase
    Write-Host "[OK] Wallet created" -ForegroundColor Green
}

# Get wallet address
$walletAddress = solana address
Write-Host "Wallet Address: $walletAddress" -ForegroundColor Cyan

# Check balance
$balance = solana balance
Write-Host "Current Balance: $balance" -ForegroundColor Cyan

Write-Host ""

# 7. Request Airdrop (if balance is low)
Write-Host "[7/8] Requesting devnet airdrop..." -ForegroundColor Yellow
try {
    solana airdrop 2
    Start-Sleep -Seconds 5
    $newBalance = solana balance
    Write-Host "[OK] Airdrop successful. New balance: $newBalance" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Airdrop failed (rate limit or network issue)" -ForegroundColor Yellow
    Write-Host "You can request more SOL at: https://faucet.solana.com" -ForegroundColor Yellow
}

Write-Host ""

# 8. Setup Environment File
Write-Host "[8/8] Setting up environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item "env.example" ".env"
    Write-Host "[OK] Environment file created (.env)" -ForegroundColor Green
    Write-Host "[INFO] Please update .env with your configuration" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Environment file already exists" -ForegroundColor Green
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  [OK] Rust: $(rustc --version)" -ForegroundColor White
Write-Host "  [OK] Solana CLI: $(solana --version)" -ForegroundColor White
Write-Host "  [OK] Anchor CLI: $(anchor --version)" -ForegroundColor White
Write-Host "  [OK] Node.js: $(node --version)" -ForegroundColor White
Write-Host "  [OK] Wallet Address: $walletAddress" -ForegroundColor White
Write-Host "  [OK] Balance: $(solana balance)" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Update .env file with your configuration" -ForegroundColor White
Write-Host "  2. Build smart contracts: anchor build" -ForegroundColor White
Write-Host "  3. Deploy to devnet: anchor deploy --provider.cluster devnet" -ForegroundColor White
Write-Host "  4. Run tests: anchor test" -ForegroundColor White
Write-Host "  5. Run examples: npm run example:status" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  - README.md - Main documentation" -ForegroundColor White
Write-Host "  - WINDOWS_DEPLOYMENT_GUIDE.md - Detailed deployment guide" -ForegroundColor White
Write-Host "  - MAGICBLOCK_INTEGRATION.md - MagicBlock integration guide" -ForegroundColor White
Write-Host ""
Write-Host "Ready to deploy!" -ForegroundColor Green