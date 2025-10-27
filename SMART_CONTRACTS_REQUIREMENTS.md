# Zephyra Smart Contract Requirements
## MagicBlock Ephemeral Rollups Integration for Solana DeFi Protection

---

## Overview

This document outlines the smart contract requirements for Zephyra, an AI-powered real-time DeFi safety layer for Solana. The platform currently operates in **simulation mode** with all protection logic implemented in the backend. This document specifies the smart contracts needed to move Zephyra to **on-chain execution** using MagicBlock Ephemeral Rollups.

### Current Status: MVP (Demo/Simulation Mode)
- ✅ AI risk analysis (OpenRouter Claude 3.5 Sonnet)
- ✅ Multi-DEX route simulation (Jupiter, Raydium, Orca)
- ✅ Transaction batching and execution
- ✅ Proof-of-Route verification
- ✅ SDK Public API with authentication
- ✅ WebSocket real-time updates
- ✅ Portfolio-level protection tracking

### Required: Smart Contract Implementation
- ⏳ On-chain transaction execution via MagicBlock
- ⏳ Verifiable proof generation on-chain
- ⏳ MEV protection enforcement at protocol level
- ⏳ Batch transaction coordination
- ⏳ On-chain fee collection and revenue distribution

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Zephyra Platform                        │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Frontend    │───▶│   Backend    │───▶│  Database    │  │
│  │  (React)     │    │  (Express)   │    │ (Postgres)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                               │
│         │                    │                               │
│         ▼                    ▼                               │
│  ┌─────────────────────────────────────────────┐           │
│  │        MagicBlock Ephemeral Rollup          │           │
│  │                                             │           │
│  │  ┌──────────────────────────────────────┐  │           │
│  │  │    Zephyra Smart Contracts (Solana)  │  │           │
│  │  │                                      │  │           │
│  │  │  • Protection Manager Program       │  │           │
│  │  │  • Route Executor Program          │  │           │
│  │  │  • Proof Verifier Program          │  │           │
│  │  │  • Batch Coordinator Program       │  │           │
│  │  └──────────────────────────────────────┘  │           │
│  │                                             │           │
│  └─────────────────────────────────────────────┘           │
│                      │                                      │
│                      ▼                                      │
│           ┌──────────────────────┐                         │
│           │  DEX Programs        │                         │
│           │  • Jupiter           │                         │
│           │  • Raydium           │                         │
│           │  • Orca              │                         │
│           └──────────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Required Smart Contracts

### 1. Protection Manager Program
**Purpose:** Central coordinator for MEV protection and transaction management

#### Program Interfaces

```rust
// Initialize protection account for user
pub fn initialize_protection(
    ctx: Context<InitializeProtection>,
    wallet_address: Pubkey,
) -> Result<()>

// Submit transaction for protection
pub fn submit_transaction(
    ctx: Context<SubmitTransaction>,
    input_token: Pubkey,
    output_token: Pubkey,
    input_amount: u64,
    min_output_amount: u64,
) -> Result<TransactionId>

// Get transaction status
pub fn get_transaction_status(
    ctx: Context<GetTransactionStatus>,
    transaction_id: TransactionId,
) -> Result<TransactionStatus>

// Update protection settings
pub fn update_settings(
    ctx: Context<UpdateSettings>,
    max_slippage: u16,  // basis points
    max_mev_risk: u8,   // 0-100
) -> Result<()>
```

#### Account Structure

```rust
#[account]
pub struct ProtectionAccount {
    pub owner: Pubkey,
    pub total_transactions: u64,
    pub total_savings: u64,          // in lamports
    pub mev_attacks_blocked: u32,
    pub settings: ProtectionSettings,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ProtectionSettings {
    pub max_slippage_bps: u16,      // basis points (100 = 1%)
    pub max_mev_risk_score: u8,     // 0-100
    pub auto_execute: bool,
    pub batch_enabled: bool,
}

#[account]
pub struct Transaction {
    pub id: [u8; 32],
    pub owner: Pubkey,
    pub input_token: Pubkey,
    pub output_token: Pubkey,
    pub input_amount: u64,
    pub output_amount: u64,
    pub risk_score: u8,
    pub selected_route: u8,         // 0=Jupiter, 1=Raydium, 2=Orca
    pub status: TransactionStatus,
    pub proof_hash: [u8; 32],
    pub batch_id: Option<[u8; 32]>,
    pub created_at: i64,
    pub completed_at: Option<i64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum TransactionStatus {
    Pending,
    Simulating,
    Analyzing,
    Executing,
    Completed,
    Failed,
}
```

#### Events

```rust
#[event]
pub struct TransactionSubmitted {
    pub transaction_id: [u8; 32],
    pub owner: Pubkey,
    pub input_token: Pubkey,
    pub output_token: Pubkey,
    pub input_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct TransactionCompleted {
    pub transaction_id: [u8; 32],
    pub output_amount: u64,
    pub savings: u64,
    pub risk_score: u8,
    pub timestamp: i64,
}

#[event]
pub struct MEVDetected {
    pub transaction_id: [u8; 32],
    pub attack_type: String,
    pub risk_score: u8,
    pub timestamp: i64,
}
```

---

### 2. Route Executor Program
**Purpose:** Execute swaps across multiple DEXs with MEV protection

#### Program Interfaces

```rust
// Execute protected swap on Jupiter
pub fn execute_jupiter_swap(
    ctx: Context<ExecuteJupiterSwap>,
    transaction_id: [u8; 32],
    route_data: Vec<u8>,
    min_output: u64,
) -> Result<u64>

// Execute protected swap on Raydium
pub fn execute_raydium_swap(
    ctx: Context<ExecuteRaydiumSwap>,
    transaction_id: [u8; 32],
    pool_address: Pubkey,
    min_output: u64,
) -> Result<u64>

// Execute protected swap on Orca
pub fn execute_orca_swap(
    ctx: Context<ExecuteOrcaSwap>,
    transaction_id: [u8; 32],
    pool_address: Pubkey,
    min_output: u64,
) -> Result<u64>

// Compare routes and select best
pub fn select_best_route(
    ctx: Context<SelectRoute>,
    routes: Vec<RouteOption>,
) -> Result<RouteSelection>
```

#### Account Structure

```rust
#[account]
pub struct RouteExecution {
    pub transaction_id: [u8; 32],
    pub dex: DEX,
    pub input_amount: u64,
    pub output_amount: u64,
    pub price_impact_bps: u16,
    pub mev_risk_score: u8,
    pub executed_at: i64,
    pub proof: ExecutionProof,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum DEX {
    Jupiter,
    Raydium,
    Orca,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RouteOption {
    pub dex: DEX,
    pub estimated_output: u64,
    pub price_impact_bps: u16,
    pub mev_risk_score: u8,
    pub liquidity_depth: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RouteSelection {
    pub selected_dex: DEX,
    pub estimated_output: u64,
    pub reasoning: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ExecutionProof {
    pub pre_balance: u64,
    pub post_balance: u64,
    pub signature: [u8; 64],
    pub timestamp: i64,
}
```

#### Events

```rust
#[event]
pub struct RouteExecuted {
    pub transaction_id: [u8; 32],
    pub dex: DEX,
    pub input_amount: u64,
    pub output_amount: u64,
    pub execution_time_ms: u32,
    pub timestamp: i64,
}

#[event]
pub struct RouteSelected {
    pub transaction_id: [u8; 32],
    pub selected_dex: DEX,
    pub alternatives_count: u8,
    pub reasoning: String,
}
```

---

### 3. Proof Verifier Program
**Purpose:** Generate and verify cryptographic proofs of route selection

#### Program Interfaces

```rust
// Generate proof-of-route
pub fn generate_proof(
    ctx: Context<GenerateProof>,
    transaction_id: [u8; 32],
    routes_considered: Vec<RouteOption>,
    selected_route: DEX,
    reasoning: String,
) -> Result<[u8; 32]>

// Verify proof
pub fn verify_proof(
    ctx: Context<VerifyProof>,
    proof_hash: [u8; 32],
    transaction_id: [u8; 32],
) -> Result<bool>

// Get proof data
pub fn get_proof_data(
    ctx: Context<GetProofData>,
    proof_hash: [u8; 32],
) -> Result<ProofData>
```

#### Account Structure

```rust
#[account]
pub struct ProofOfRoute {
    pub proof_hash: [u8; 32],
    pub transaction_id: [u8; 32],
    pub routes_considered: Vec<RouteOption>,
    pub selected_route: DEX,
    pub selection_reasoning: String,
    pub mev_detection_log: Vec<MEVDetection>,
    pub simulation_time_ms: u32,
    pub route_selection_time_ms: u32,
    pub execution_time_ms: u32,
    pub total_time_ms: u32,
    pub blockchain_signature: Option<[u8; 64]>,
    pub created_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MEVDetection {
    pub attack_type: MEVAttackType,
    pub probability: u8,  // 0-100
    pub detected_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum MEVAttackType {
    SandwichAttack,
    FrontRunning,
    BackRunning,
    Arbitrage,
}
```

#### Events

```rust
#[event]
pub struct ProofGenerated {
    pub proof_hash: [u8; 32],
    pub transaction_id: [u8; 32],
    pub routes_count: u8,
    pub timestamp: i64,
}

#[event]
pub struct ProofVerified {
    pub proof_hash: [u8; 32],
    pub valid: bool,
    pub timestamp: i64,
}
```

---

### 4. Batch Coordinator Program
**Purpose:** Coordinate multiple transactions for efficient execution

#### Program Interfaces

```rust
// Create new batch
pub fn create_batch(
    ctx: Context<CreateBatch>,
) -> Result<[u8; 32]>

// Add transaction to batch
pub fn add_to_batch(
    ctx: Context<AddToBatch>,
    batch_id: [u8; 32],
    transaction_id: [u8; 32],
) -> Result<()>

// Execute batch
pub fn execute_batch(
    ctx: Context<ExecuteBatch>,
    batch_id: [u8; 32],
) -> Result<BatchExecutionResult>

// Get batch status
pub fn get_batch_status(
    ctx: Context<GetBatchStatus>,
    batch_id: [u8; 32],
) -> Result<BatchStatus>
```

#### Account Structure

```rust
#[account]
pub struct Batch {
    pub id: [u8; 32],
    pub transactions: Vec<[u8; 32]>,  // transaction IDs
    pub transaction_count: u32,
    pub total_value: u64,             // in lamports
    pub status: BatchStatus,
    pub created_at: i64,
    pub executed_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub execution_time_ms: Option<u32>,
    pub batch_hash: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum BatchStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct BatchExecutionResult {
    pub batch_id: [u8; 32],
    pub successful_txs: u32,
    pub failed_txs: u32,
    pub total_savings: u64,
    pub execution_time_ms: u32,
}
```

#### Events

```rust
#[event]
pub struct BatchCreated {
    pub batch_id: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct BatchExecuted {
    pub batch_id: [u8; 32],
    pub transaction_count: u32,
    pub total_value: u64,
    pub execution_time_ms: u32,
    pub timestamp: i64,
}

#[event]
pub struct TransactionAddedToBatch {
    pub batch_id: [u8; 32],
    pub transaction_id: [u8; 32],
    pub timestamp: i64,
}
```

---

## MagicBlock Ephemeral Rollups Integration

### Why MagicBlock?

1. **Sub-100ms Execution**: Critical for MEV protection
2. **Ephemeral State**: Perfect for temporary transaction simulation
3. **Solana Compatibility**: Seamless integration with existing DEXs
4. **Cost Efficiency**: Lower fees than mainnet execution

### Integration Points

#### 1. Rollup Session Management

```rust
// Initialize ephemeral rollup session
pub fn init_rollup_session(
    ctx: Context<InitRollupSession>,
    transaction_id: [u8; 32],
) -> Result<RollupSessionId>

// Execute in rollup
pub fn execute_in_rollup(
    ctx: Context<ExecuteInRollup>,
    session_id: RollupSessionId,
    instructions: Vec<Instruction>,
) -> Result<RollupResult>

// Commit rollup state to mainnet
pub fn commit_rollup(
    ctx: Context<CommitRollup>,
    session_id: RollupSessionId,
) -> Result<CommitProof>
```

#### 2. State Synchronization

```typescript
// Backend synchronization with MagicBlock
interface RollupSync {
  // Listen for rollup events
  subscribeToRollup(sessionId: string): EventStream;
  
  // Commit final state
  commitState(sessionId: string, proof: Proof): Promise<TxSignature>;
  
  // Rollback on failure
  rollbackState(sessionId: string): Promise<void>;
}
```

#### 3. Transaction Lifecycle

```
1. User submits swap request
   ↓
2. Backend creates MagicBlock rollup session
   ↓
3. AI analyzes MEV risk in rollup environment
   ↓
4. Simulate routes across DEXs in rollup
   ↓
5. Select optimal route
   ↓
6. Execute transaction in rollup
   ↓
7. Generate proof-of-route
   ↓
8. Commit final state to Solana mainnet
   ↓
9. Update user stats and emit events
```

---

## Data Flow Diagrams

### Transaction Simulation Flow

```
┌────────┐
│ User   │
│Request │
└───┬────┘
    │
    ▼
┌─────────────────────┐
│ Protection Manager  │
│ submit_transaction()│
└─────────┬───────────┘
          │
          ├──────────────────────────┐
          │                          │
          ▼                          ▼
┌──────────────────┐      ┌──────────────────┐
│ MagicBlock       │      │ AI Risk Analysis │
│ Rollup Session   │◄────▶│ (Off-chain)      │
└──────────┬───────┘      └──────────────────┘
           │
           ├─────────┬─────────┬─────────┐
           ▼         ▼         ▼         ▼
       ┌────────┐┌────────┐┌────────┐
       │Jupiter ││Raydium ││ Orca   │
       │Simulate││Simulate││Simulate│
       └───┬────┘└───┬────┘└───┬────┘
           │         │         │
           └────────┬┴─────────┘
                    ▼
           ┌─────────────────┐
           │ Route Executor  │
           │ select_best()   │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │ Proof Verifier  │
           │ generate_proof()│
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │ Commit to       │
           │ Solana Mainnet  │
           └─────────────────┘
```

### Batch Execution Flow

```
┌───────────────────────────────────────┐
│ Batch Coordinator                     │
│                                       │
│  ┌────────────────────────────────┐  │
│  │ Pending Batch                  │  │
│  │ • TX1: 1 SOL → USDC           │  │
│  │ • TX2: 2 SOL → USDT           │  │
│  │ • TX3: 0.5 SOL → BONK         │  │
│  │ • TX4: 3 SOL → RAY            │  │
│  │ • TX5: 1.5 SOL → JUP          │  │
│  └────────────┬───────────────────┘  │
│               │                       │
│               ▼ (threshold reached)   │
│  ┌────────────────────────────────┐  │
│  │ execute_batch()                │  │
│  └────────────┬───────────────────┘  │
└───────────────┼───────────────────────┘
                │
                ├─────────────┐
                │             │
                ▼             ▼
    ┌──────────────────┐  ┌──────────────────┐
    │ MagicBlock       │  │ Parallel Route   │
    │ Rollup Session   │  │ Simulation       │
    └────────┬─────────┘  └────────┬─────────┘
             │                     │
             ├─────────────────────┤
             │                     │
             ▼                     ▼
    ┌──────────────────────────────────┐
    │ Coordinate Multi-TX Execution    │
    │ • Optimize gas usage             │
    │ • Prevent inter-batch MEV        │
    │ • Batch proof generation         │
    └──────────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │ Commit Batch to Mainnet          │
    │ • Emit BatchExecuted event       │
    │ • Update user stats (5 users)    │
    │ • Generate batch proof hash      │
    └──────────────────────────────────┘
```

---

## Integration Guide: Backend to Smart Contracts

### Current Backend Structure

```typescript
// server/routes.ts - Current simulation flow
app.post("/api/simulate", async (req, res) => {
  // 1. Simulate routes (to be moved to smart contract)
  const routes = await simulateRoutes(inputToken, outputToken, inputAmount);
  
  // 2. Analyze risk with AI (stays off-chain)
  const riskAnalysis = await analyzeRiskWithAI(...);
  
  // 3. Select best route (to be moved to smart contract)
  const selectedRoute = selectBestRoute(routes);
  
  // 4. Create transaction record (to be stored on-chain)
  const transaction = await storage.createTransaction(...);
  
  // 5. Add to batch (to be coordinated by smart contract)
  const batch = await getOrCreateBatch();
});
```

### Migrated Smart Contract Flow

```typescript
// server/routes.ts - With smart contracts
app.post("/api/simulate", async (req, res) => {
  // 1. Submit transaction to Protection Manager
  const txId = await protectionManager.submitTransaction({
    inputToken: new PublicKey(inputToken),
    outputToken: new PublicKey(outputToken),
    inputAmount: parseFloat(inputAmount) * LAMPORTS_PER_SOL,
  });
  
  // 2. AI analysis (still off-chain but feeds into contract)
  const riskAnalysis = await analyzeRiskWithAI(...);
  
  // 3. Initialize rollup session
  const sessionId = await magicBlock.initRollupSession(txId);
  
  // 4. Execute route simulation in rollup
  const routes = await routeExecutor.selectBestRoute({
    sessionId,
    routes: simulatedRoutes,
    riskScore: riskAnalysis.score,
  });
  
  // 5. Generate proof
  const proofHash = await proofVerifier.generateProof({
    transactionId: txId,
    routesConsidered: routes,
    selectedRoute: routes.selected,
  });
  
  // 6. Add to batch coordinator
  const batch = await batchCoordinator.addToBatch(currentBatchId, txId);
  
  // 7. Commit rollup state
  const signature = await magicBlock.commitRollup(sessionId);
  
  res.json({ transactionId: txId, proofHash, signature });
});
```

### Environment Configuration

```env
# .env - Smart contract addresses
PROTECTION_MANAGER_PROGRAM_ID=<program_id>
ROUTE_EXECUTOR_PROGRAM_ID=<program_id>
PROOF_VERIFIER_PROGRAM_ID=<program_id>
BATCH_COORDINATOR_PROGRAM_ID=<program_id>

# MagicBlock configuration
MAGICBLOCK_RPC_URL=<rollup_rpc_url>
MAGICBLOCK_API_KEY=<api_key>

# Solana configuration
SOLANA_CLUSTER=devnet|mainnet-beta
SOLANA_RPC_URL=<rpc_url>
WALLET_PRIVATE_KEY=<base58_private_key>
```

---

## Deployment Checklist

### Smart Contract Deployment

- [ ] 1. Deploy Protection Manager Program
  - [ ] Initialize program authority
  - [ ] Set fee collection account
  - [ ] Configure MEV risk thresholds

- [ ] 2. Deploy Route Executor Program
  - [ ] Verify DEX program integrations (Jupiter, Raydium, Orca)
  - [ ] Set slippage tolerance limits
  - [ ] Configure route selection algorithm

- [ ] 3. Deploy Proof Verifier Program
  - [ ] Initialize proof storage accounts
  - [ ] Configure proof generation parameters
  - [ ] Set verification rules

- [ ] 4. Deploy Batch Coordinator Program
  - [ ] Set batch size threshold (default: 5 transactions)
  - [ ] Set batch time threshold (default: 30 seconds)
  - [ ] Configure execution prioritization

### MagicBlock Integration

- [ ] 5. Configure MagicBlock Rollup
  - [ ] Create rollup instance
  - [ ] Configure state commitment rules
  - [ ] Set rollback policies

- [ ] 6. Connect Backend to Smart Contracts
  - [ ] Update API routes to call smart contracts
  - [ ] Implement event listeners for contract events
  - [ ] Add transaction signing logic

- [ ] 7. Database Schema Updates
  - [ ] Add blockchain signature fields
  - [ ] Store contract addresses
  - [ ] Add rollup session tracking

### Testing & Validation

- [ ] 8. End-to-End Testing
  - [ ] Test single transaction flow
  - [ ] Test batch execution
  - [ ] Test proof generation and verification
  - [ ] Test MEV attack scenarios

- [ ] 9. Performance Benchmarks
  - [ ] Measure transaction latency
  - [ ] Verify sub-100ms execution time
  - [ ] Test rollup state commitment speed

- [ ] 10. Security Audit
  - [ ] Smart contract security review
  - [ ] Penetration testing
  - [ ] MEV protection validation

---

## Cost Analysis

### Gas Costs (Estimated)

| Operation | Compute Units | SOL Cost (approx) |
|-----------|--------------|-------------------|
| Submit Transaction | 50,000 | 0.00025 SOL |
| Route Simulation | 200,000 | 0.001 SOL |
| Proof Generation | 100,000 | 0.0005 SOL |
| Batch Execution (5 tx) | 400,000 | 0.002 SOL |
| Proof Verification | 30,000 | 0.00015 SOL |

### MagicBlock Costs

- **Rollup Session Creation**: ~0.0001 SOL
- **State Commitment**: ~0.0003 SOL per batch
- **Hourly Rollup Fee**: ~0.01 SOL (waived during beta)

### Revenue Model

- **Protection Fee**: 0.1% of transaction value
- **Batch Coordination Fee**: 0.05% per transaction
- **API Access (SDK)**: Tiered pricing based on request volume

---

## Success Metrics

### Technical Metrics
- ✅ Transaction execution < 100ms
- ✅ MEV attack detection accuracy > 95%
- ✅ Proof generation time < 50ms
- ✅ Batch execution efficiency > 90%

### Business Metrics
- 📊 Total transactions protected
- 💰 Total MEV savings for users
- 🔒 MEV attacks blocked
- 👥 Active wallets using protection

---

## Future Enhancements

### Phase 2: Advanced Features
- Cross-chain MEV protection (Ethereum, BSC, Polygon)
- Flash loan protection
- Governance token for protocol decisions
- Staking rewards for liquidity providers

### Phase 3: Decentralization
- DAO governance
- Community-driven risk models
- Decentralized AI inference nodes
- Open-source risk analysis algorithms

---

## Support & Resources

### Documentation
- **MagicBlock Docs**: https://docs.magicblock.gg
- **Solana Cookbook**: https://solanacookbook.com
- **Anchor Framework**: https://www.anchor-lang.com

### Community
- **Discord**: [Join Zephyra Discord]
- **GitHub**: [Zephyra Smart Contracts Repo]
- **Twitter**: [@ZephyraProtocol]

---

## Conclusion

This document provides a comprehensive roadmap for transitioning Zephyra from simulation mode to full on-chain execution using MagicBlock Ephemeral Rollups. The modular architecture allows for incremental deployment, starting with the Protection Manager and gradually adding Route Executor, Proof Verifier, and Batch Coordinator programs.

**Next Steps:**
1. Set up Solana development environment
2. Initialize Anchor project for each program
3. Implement Protection Manager program first
4. Integrate with MagicBlock testnet
5. Deploy to devnet for testing
6. Conduct security audit
7. Deploy to mainnet-beta

**Estimated Timeline:** 8-12 weeks for full smart contract implementation

---

**Document Version:** 1.0  
**Last Updated:** October 25, 2025  
**Maintained By:** Zephyra Development Team
