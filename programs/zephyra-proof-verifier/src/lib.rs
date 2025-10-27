use anchor_lang::prelude::*;

declare_id!("Cw8CFyM9FkoMi7KTYpkqXZ4e4v5X3sJ7W8dL2mN9pQrT");

/// Zephyra Proof Verifier Program
/// Generate and verify cryptographic proofs of route selection
#[program]
pub mod proof_verifier {
    use super::*;

    /// Generate proof-of-route
    pub fn generate_proof(
        ctx: Context<GenerateProof>,
        transaction_id: [u8; 32],
        routes_considered: Vec<RouteOption>,
        selected_route: DEX,
        reasoning: String,
    ) -> Result<[u8; 32]> {
        let proof_account = &mut ctx.accounts.proof_account;
        let clock = Clock::get()?;

        // Generate proof hash
        let proof_hash = generate_proof_hash(
            &transaction_id,
            &routes_considered,
            &selected_route,
            &reasoning,
            clock.unix_timestamp,
        );

        // Initialize proof account
        proof_account.proof_hash = proof_hash;
        proof_account.transaction_id = transaction_id;
        proof_account.routes_considered = routes_considered;
        proof_account.selected_route = selected_route;
        proof_account.selection_reasoning = reasoning;
        proof_account.mev_detection_log = Vec::new(); // Will be populated by MEV detection
        proof_account.simulation_time = 50; // Simulated timing
        proof_account.route_selection_time = 30;
        proof_account.execution_time = 20;
        proof_account.total_time = 100;
        proof_account.blockchain_signature = None; // Will be set after mainnet commit
        proof_account.created_at = clock.unix_timestamp;

        emit!(ProofGenerated {
            proof_hash,
            transaction_id,
            routes_count: proof_account.routes_considered.len() as u8,
            timestamp: clock.unix_timestamp,
        });

        Ok(proof_hash)
    }

    /// Verify proof
    pub fn verify_proof(
        ctx: Context<VerifyProof>,
        proof_hash: [u8; 32],
        transaction_id: [u8; 32],
    ) -> Result<bool> {
        let proof_account = &ctx.accounts.proof_account;

        // Verify proof hash matches
        let is_valid = proof_account.proof_hash == proof_hash
            && proof_account.transaction_id == transaction_id;

        emit!(ProofVerified {
            proof_hash,
            valid: is_valid,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(is_valid)
    }

    /// Get proof data
    pub fn get_proof_data(
        ctx: Context<GetProofData>,
        proof_hash: [u8; 32],
    ) -> Result<ProofData> {
        let proof_account = &ctx.accounts.proof_account;

        require!(
            proof_account.proof_hash == proof_hash,
            ErrorCode::InvalidProofHash
        );

        let proof_data = ProofData {
            proof_hash,
            transaction_id: proof_account.transaction_id,
            routes_considered: proof_account.routes_considered.clone(),
            selected_route: proof_account.selected_route.clone(),
            selection_reasoning: proof_account.selection_reasoning.clone(),
            mev_detection_log: proof_account.mev_detection_log.clone(),
            simulation_time: proof_account.simulation_time,
            route_selection_time: proof_account.route_selection_time,
            execution_time: proof_account.execution_time,
            total_time: proof_account.total_time,
            blockchain_signature: proof_account.blockchain_signature,
            created_at: proof_account.created_at,
        };

        Ok(proof_data)
    }

    /// Add MEV detection to proof
    pub fn add_mev_detection(
        ctx: Context<AddMEVDetection>,
        proof_hash: [u8; 32],
        attack_type: MEVAttackType,
        probability: u8,
    ) -> Result<()> {
        let proof_account = &mut ctx.accounts.proof_account;

        require!(
            proof_account.proof_hash == proof_hash,
            ErrorCode::InvalidProofHash
        );
        require!(probability <= 100, ErrorCode::InvalidProbability);

        let mev_detection = MEVDetection {
            attack_type,
            probability,
            detected_at: Clock::get()?.unix_timestamp,
        };

        proof_account.mev_detection_log.push(mev_detection);

        emit!(MEVDetectionAdded {
            proof_hash,
            attack_type,
            probability,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Update execution timing
    pub fn update_execution_timing(
        ctx: Context<UpdateExecutionTiming>,
        proof_hash: [u8; 32],
        simulation_time: u32,
        route_selection_time: u32,
        execution_time: u32,
    ) -> Result<()> {
        let proof_account = &mut ctx.accounts.proof_account;

        require!(
            proof_account.proof_hash == proof_hash,
            ErrorCode::InvalidProofHash
        );

        proof_account.simulation_time = simulation_time;
        proof_account.route_selection_time = route_selection_time;
        proof_account.execution_time = execution_time;
        proof_account.total_time = simulation_time + route_selection_time + execution_time;

        emit!(ExecutionTimingUpdated {
            proof_hash,
            total_time: proof_account.total_time,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Set blockchain signature after mainnet commit
    pub fn set_blockchain_signature(
        ctx: Context<SetBlockchainSignature>,
        proof_hash: [u8; 32],
        signature: [u8; 64],
    ) -> Result<()> {
        let proof_account = &mut ctx.accounts.proof_account;

        require!(
            proof_account.proof_hash == proof_hash,
            ErrorCode::InvalidProofHash
        );

        proof_account.blockchain_signature = Some(signature);

        emit!(BlockchainSignatureSet {
            proof_hash,
            signature,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

/// Generate proof hash from all proof components
fn generate_proof_hash(
    transaction_id: &[u8; 32],
    routes_considered: &[RouteOption],
    selected_route: &DEX,
    reasoning: &str,
    timestamp: i64,
) -> [u8; 32] {
    let mut hash = [0u8; 32];
    
    // XOR transaction ID
    for (i, byte) in transaction_id.iter().enumerate() {
        hash[i] ^= byte;
    }
    
    // XOR routes considered
    for route in routes_considered {
        hash[0] ^= route.dex.to_bytes()[0];
        let output_bytes = route.estimated_output.to_le_bytes();
        for (i, byte) in output_bytes.iter().enumerate() {
            hash[(i + 8) % 32] ^= byte;
        }
        hash[16] ^= route.mev_risk_score;
    }
    
    // XOR selected route
    hash[17] ^= selected_route.to_bytes()[0];
    
    // XOR reasoning bytes (limited to avoid overflow)
    for (i, byte) in reasoning.as_bytes().iter().take(8).enumerate() {
        hash[18 + i] ^= byte;
    }
    
    // XOR timestamp
    let timestamp_bytes = timestamp.to_le_bytes();
    for (i, byte) in timestamp_bytes.iter().enumerate() {
        hash[26 + i] ^= byte;
    }
    
    hash
}

/// Convert DEX enum to bytes for hashing
trait ToBytes {
    fn to_bytes(&self) -> [u8; 1];
}

impl ToBytes for DEX {
    fn to_bytes(&self) -> [u8; 1] {
        match self {
            DEX::Jupiter => [0],
            DEX::Raydium => [1],
            DEX::Orca => [2],
        }
    }
}

#[derive(Accounts)]
#[instruction(transaction_id: [u8; 32], routes_considered: Vec<RouteOption>, selected_route: DEX, reasoning: String)]
pub struct GenerateProof<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + ProofOfRoute::INIT_SPACE,
        seeds = [b"proof", transaction_id.as_ref()],
        bump
    )]
    pub proof_account: Account<'info, ProofOfRoute>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(proof_hash: [u8; 32], transaction_id: [u8; 32])]
pub struct VerifyProof<'info> {
    #[account(
        seeds = [b"proof", transaction_id.as_ref()],
        bump
    )]
    pub proof_account: Account<'info, ProofOfRoute>,
}

#[derive(Accounts)]
#[instruction(proof_hash: [u8; 32])]
pub struct GetProofData<'info> {
    #[account(
        seeds = [b"proof", &proof_account.transaction_id],
        bump
    )]
    pub proof_account: Account<'info, ProofOfRoute>,
}

#[derive(Accounts)]
#[instruction(proof_hash: [u8; 32], attack_type: MEVAttackType, probability: u8)]
pub struct AddMEVDetection<'info> {
    #[account(
        mut,
        seeds = [b"proof", &proof_account.transaction_id],
        bump
    )]
    pub proof_account: Account<'info, ProofOfRoute>,
}

#[derive(Accounts)]
#[instruction(proof_hash: [u8; 32], simulation_time: u32, route_selection_time: u32, execution_time: u32)]
pub struct UpdateExecutionTiming<'info> {
    #[account(
        mut,
        seeds = [b"proof", &proof_account.transaction_id],
        bump
    )]
    pub proof_account: Account<'info, ProofOfRoute>,
}

#[derive(Accounts)]
#[instruction(proof_hash: [u8; 32], signature: [u8; 64])]
pub struct SetBlockchainSignature<'info> {
    #[account(
        mut,
        seeds = [b"proof", &proof_account.transaction_id],
        bump
    )]
    pub proof_account: Account<'info, ProofOfRoute>,
}

#[account]
#[derive(InitSpace)]
pub struct ProofOfRoute {
    pub proof_hash: [u8; 32],
    pub transaction_id: [u8; 32],
    #[max_len(10)]
    pub routes_considered: Vec<RouteOption>,
    pub selected_route: DEX,
    #[max_len(500)]
    pub selection_reasoning: String,
    #[max_len(20)]
    pub mev_detection_log: Vec<MEVDetection>,
    pub simulation_time: u32,
    pub route_selection_time: u32,
    pub execution_time: u32,
    pub total_time: u32,
    pub blockchain_signature: Option<[u8; 64]>,
    pub created_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct MEVDetection {
    pub attack_type: MEVAttackType,
    pub probability: u8, // 0-100
    pub detected_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace)]
pub enum MEVAttackType {
    SandwichAttack,
    FrontRunning,
    BackRunning,
    Arbitrage,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct RouteOption {
    pub dex: DEX,
    pub estimated_output: u64,
    pub price_impact_bps: u16,
    pub mev_risk_score: u8,
    pub liquidity_depth: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum DEX {
    Jupiter,
    Raydium,
    Orca,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct ProofData {
    pub proof_hash: [u8; 32],
    pub transaction_id: [u8; 32],
    #[max_len(10)]
    pub routes_considered: Vec<RouteOption>,
    pub selected_route: DEX,
    #[max_len(500)]
    pub selection_reasoning: String,
    #[max_len(20)]
    pub mev_detection_log: Vec<MEVDetection>,
    pub simulation_time: u32,
    pub route_selection_time: u32,
    pub execution_time: u32,
    pub total_time: u32,
    pub blockchain_signature: Option<[u8; 64]>,
    pub created_at: i64,
}

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

#[event]
pub struct MEVDetectionAdded {
    pub proof_hash: [u8; 32],
    pub attack_type: MEVAttackType,
    pub probability: u8,
    pub timestamp: i64,
}

#[event]
pub struct ExecutionTimingUpdated {
    pub proof_hash: [u8; 32],
    pub total_time: u32,
    pub timestamp: i64,
}

#[event]
pub struct BlockchainSignatureSet {
    pub proof_hash: [u8; 32],
    pub signature: [u8; 64],
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid proof hash")]
    InvalidProofHash,
    #[msg("Invalid probability value")]
    InvalidProbability,
    #[msg("Proof not found")]
    ProofNotFound,
    #[msg("Invalid timing values")]
    InvalidTiming,
}


