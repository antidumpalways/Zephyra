# 🚀 Zephyra Contracts Deployment Guide

## Automated Deployment with GitHub Actions

Setiap push ke branch `main` akan otomatis:
1. ✅ Build semua 4 programs di Linux environment
2. ✅ Run tests
3. ✅ Deploy ke Solana Devnet
4. ✅ Generate program IDs

### Setup GitHub Secrets

Untuk enable auto-deployment, tambahkan secret di GitHub:

1. **Buka:** https://github.com/Modolo-oss/zephyra/settings/secrets/actions
2. **Klik:** "New repository secret"
3. **Name:** `SOLANA_DEPLOYER_PRIVATE_KEY`
4. **Value:** Paste isi file `~/.config/solana/id.json` Anda

```bash
# Copy private key
cat ~/.config/solana/id.json
```

### Monitor Deployment

Setelah push:
- **Actions Tab:** https://github.com/Modolo-oss/zephyra/actions
- Lihat progress build & deploy real-time
- Download artifacts (compiled .so files)
- Lihat Program IDs di summary

---

## Manual Deployment (WSL/Linux)

### Prerequisites

```bash
# Solana CLI
curl -sSfL https://release.solana.com/v1.18.26/install | sh

# Anchor CLI  
cargo install --git https://github.com/coral-xyz/anchor --tag v0.32.1 anchor-cli --locked

# Rust 1.82.0
rustup install 1.82.0
rustup default 1.82.0
```

### Build

```bash
anchor build
```

### Deploy ke Devnet

```bash
# Set cluster
solana config set --url https://api.devnet.solana.com

# Check balance (perlu ~3-5 SOL)
solana balance

# Deploy
anchor deploy --provider.cluster devnet
```

### Deploy ke Mainnet

```bash
# Set cluster
solana config set --url https://api.mainnet-beta.solana.com

# ⚠️ PASTIKAN BALANCE CUKUP (10-20 SOL)
solana balance

# Deploy
anchor deploy --provider.cluster mainnet-beta
```

---

## Program Addresses

### Devnet

| Program | Address |
|---------|---------|
| Protection Manager | `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS` |
| Route Executor | `9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM` |
| Proof Verifier | `Cw8CFyM9FkoMi7KTYpkqXZ4e4v5X3sJ7W8dL2mN9pQrT` |
| Batch Coordinator | `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU` |

*Note: Addresses akan berubah setelah deployment pertama*

---

## Verify Deployment

```bash
# Check program account
solana program show <PROGRAM_ID>

# Get program logs
solana logs <PROGRAM_ID>
```

---

## Troubleshooting

### Build gagal di WSL

**Problem:** Docker error atau cargo-build-sbf tidak jalan

**Solution:** Gunakan GitHub Actions (build di Linux cloud)

### Deploy gagal - Insufficient funds

**Problem:** Balance tidak cukup

**Solution:** 
```bash
# Devnet - request airdrop
solana airdrop 2

# Mainnet - transfer SOL dari exchange
```

### Deploy gagal - Program data too large

**Problem:** Program size > 1MB

**Solution:** Optimize dengan:
```bash
anchor build --release
```

---

## Cost Estimation

| Network | Per Program | Total (4 programs) |
|---------|-------------|-------------------|
| Devnet | Free (airdrop) | Free |
| Mainnet | ~0.5-1 SOL | ~2-4 SOL |

---

## Next Steps

1. ✅ Push code ke GitHub
2. ✅ Setup GitHub Secret untuk wallet
3. ✅ Watch Actions tab untuk deployment
4. ✅ Update frontend dengan Program IDs baru
5. ✅ Test di devnet
6. ✅ Deploy ke mainnet

---

## Support

- GitHub Issues: https://github.com/Modolo-oss/zephyra/issues
- Solana Docs: https://docs.solana.com
- Anchor Docs: https://www.anchor-lang.com

---

**Built with ❤️ by Modolo**


