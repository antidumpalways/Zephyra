# 🚀 Zephyra Smart Contracts - Solana Playground Deployment Guide

## Kenapa Solana Playground?

Karena ada masalah dengan Solana BPF SDK di WSL, cara tercepat dan termudah adalah deploy via Solana Playground (browser-based IDE).

**Keuntungan:**
- ✅ No installation needed
- ✅ Build & deploy dalam 5-10 menit
- ✅ Langsung dapat Program IDs
- ✅ Built-in wallet & devnet airdrop

## 📋 Step-by-Step Deployment

### Step 1: Buka Solana Playground

1. Buka browser: https://beta.solpg.io/
2. Klik "Create a new project"
3. Pilih framework: **Anchor (Rust)**
4. Beri nama: `zephyra-protection-manager`

### Step 2: Deploy Protection Manager

#### 2.1 Upload Main File

Klik file `src/lib.rs` di Playground, lalu replace dengan konten dari:
```
programs/zephyra-protection-manager/src/lib.rs
```

#### 2.2 Upload Additional Files

Buat file baru di Playground:

**File: `src/protection_manager.rs`**
Copy dari: `programs/zephyra-protection-manager/src/protection_manager.rs`

**File: `src/magicblock_integration.rs`**
Copy dari: `programs/zephyra-protection-manager/src/magicblock_integration.rs`

#### 2.3 Update Cargo.toml

Replace `Cargo.toml` dengan:
```toml
[package]
name = "zephyra-protection-manager"
version = "1.0.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "zephyra_protection_manager"

[features]
no-entrypoint = []
no-idl = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.30.1"
anchor-spl = "0.30.1"
```

#### 2.4 Build & Deploy

1. **Build**: Klik tombol "Build" (atau Ctrl+S)
   - Wait 2-3 minutes
   - Check for errors in console

2. **Get Devnet SOL**:
   - Klik "Airdrop" button (top right)
   - Request 5 SOL

3. **Deploy**:
   - Klik "Deploy" button
   - Select cluster: **Devnet**
   - Confirm deployment
   - **SAVE THE PROGRAM ID!** ⭐

### Step 3: Deploy Route Executor

1. Create new project: `zephyra-route-executor`
2. Choose: **Anchor (Rust)**
3. Replace `src/lib.rs` with: `programs/zephyra-route-executor/src/lib.rs`
4. Update Cargo.toml:

```toml
[package]
name = "zephyra-route-executor"
version = "1.0.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "zephyra_route_executor"

[features]
no-entrypoint = []
no-idl = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.30.1"
anchor-spl = "0.30.1"
```

5. Build & Deploy
6. **SAVE THE PROGRAM ID!** ⭐

### Step 4: Deploy Proof Verifier

1. Create new project: `zephyra-proof-verifier`
2. Choose: **Anchor (Rust)**
3. Replace `src/lib.rs` with: `programs/zephyra-proof-verifier/src/lib.rs`
4. Update Cargo.toml:

```toml
[package]
name = "zephyra-proof-verifier"
version = "1.0.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "zephyra_proof_verifier"

[features]
no-entrypoint = []
no-idl = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.30.1"
```

5. Build & Deploy
6. **SAVE THE PROGRAM ID!** ⭐

### Step 5: Deploy Batch Coordinator

1. Create new project: `zephyra-batch-coordinator`
2. Choose: **Anchor (Rust)**
3. Replace `src/lib.rs` with: `programs/zephyra-batch-coordinator/src/lib.rs`
4. Update Cargo.toml:

```toml
[package]
name = "zephyra-batch-coordinator"
version = "1.0.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "zephyra_batch_coordinator"

[features]
no-entrypoint = []
no-idl = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.30.1"
```

5. Build & Deploy
6. **SAVE THE PROGRAM ID!** ⭐

### Step 6: Update .env File

Setelah semua deployed, update file `.env` di project lokal:

```env
# Deployed Program IDs
PROTECTION_MANAGER_PROGRAM_ID=<program_id_1>
ROUTE_EXECUTOR_PROGRAM_ID=<program_id_2>
PROOF_VERIFIER_PROGRAM_ID=<program_id_3>
BATCH_COORDINATOR_PROGRAM_ID=<program_id_4>

# MagicBlock Configuration
MAGICBLOCK_RPC_URL=https://devnet-router.magicblock.app
SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Step 7: Verify Deployment

Untuk setiap Program ID, verify di Solana Explorer:

```
https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet
```

## 🎯 Quick Tips

### Build Errors?

**Common Issue**: Import errors
- Make sure all `use` statements are correct
- Check that module names match file names

**Common Issue**: Type errors
- Verify all types are defined in the same file
- Remove cross-program imports (Transaction type, etc.)

### Deployment Fails?

**Issue**: Insufficient balance
- Request more SOL: Click "Airdrop" button
- Or visit: https://faucet.solana.com

**Issue**: Program already deployed
- Use different wallet
- Or upgrade existing program

### Can't Find Program ID?

After deployment, look in the console output:
```
Program Id: <YOUR_PROGRAM_ID>
```

Copy this ID immediately!

## 📊 Expected Timeline

- Protection Manager: 5-7 minutes (largest program)
- Route Executor: 3-5 minutes
- Proof Verifier: 3-5 minutes
- Batch Coordinator: 3-5 minutes

**Total: ~20-30 minutes** untuk deploy semua 4 programs

## 🎉 After Deployment

Once all 4 programs are deployed:

1. ✅ Update `.env` with Program IDs
2. ✅ Test with MagicBlock:
   ```bash
   npm run example:status
   npm run example:swap
   ```
3. ✅ Integrate with backend
4. ✅ Test end-to-end flow

## 🆘 Need Help?

**Solana Playground Docs**: https://beta.solpg.io/docs
**Anchor Docs**: https://www.anchor-lang.com/docs

---

**Ready to deploy! Start with Protection Manager first, then move to the others.** 🚀
