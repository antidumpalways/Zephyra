use anchor_lang::prelude::*;

declare_id!("835NApE56thzrECSzQnBiEGgwDpgHbeMxw9xPWHZcsEj");

/// Zephyra Protection Manager Program
/// Central coordinator for MEV protection and transaction management
#[program]
pub mod zephyra_protection_manager {
    use super::*;

    /// Initialize protection account for user
    pub fn initialize_protection(
        ctx: Context<InitializeProtection>,
        wallet_address: Pubkey,
    ) -> Result<()> {
        let protection_account = &mut ctx.accounts.protection_account;
        let clock = Clock::get()?;

        protection_account.owner = wallet_address;
        protection_account.total_transactions = 0;
        protection_account.total_savings = 0;
        protection_account.mev_attacks_blocked = 0;
        protection_account.settings = ProtectionSettings {
            max_slippage_bps: 100, // 1% default
            max_mev_risk_score: 50, // Medium risk threshold
            auto_execute: true,
            batch_enabled: true,
        };
        protection_account.bump = ctx.bumps.protection_account;

        emit!(ProtectionInitialized {
            owner: wallet_address,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Submit transaction for protection
    pub fn submit_transaction(
        ctx: Context<SubmitTransaction>,
        input_token: Pubkey,
        output_token: Pubkey,
        input_amount: u64,
        _min_output_amount: u64,
    ) -> Result<[u8; 32]> {
        let transaction_account = &mut ctx.accounts.transaction_account;
        let protection_account = &mut ctx.accounts.protection_account;
        let clock = Clock::get()?;

        // Generate unique transaction ID
        let transaction_id = generate_transaction_id(
            &protection_account.owner,
            &input_token,
            &output_token,
            input_amount,
            clock.unix_timestamp,
        );

        transaction_account.id = transaction_id;
        transaction_account.owner = protection_account.owner;
        transaction_account.input_token = input_token;
        transaction_account.output_token = output_token;
        transaction_account.input_amount = input_amount;
        transaction_account.output_amount = 0; // Will be set after execution
        transaction_account.risk_score = 0; // Will be set by AI analysis
        transaction_account.selected_route = 0; // 0=Jupiter, 1=Raydium, 2=Orca
        transaction_account.status = TransactionStatus::Pending;
        transaction_account.proof_hash = [0u8; 32]; // Will be set after proof generation
        transaction_account.batch_id = None;
        transaction_account.created_at = clock.unix_timestamp;
        transaction_account.completed_at = None;

        // Update protection account stats
        protection_account.total_transactions += 1;

        emit!(TransactionSubmitted {
            transaction_id,
            owner: protection_account.owner,
            input_token,
            output_token,
            input_amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(transaction_id)
    }

    /// Get transaction status
    pub fn get_transaction_status(
        ctx: Context<GetTransactionStatus>,
        transaction_id: [u8; 32],
    ) -> Result<TransactionStatus> {
        let transaction_account = &ctx.accounts.transaction_account;
        
        require!(
            transaction_account.id == transaction_id,
            ErrorCode::InvalidTransactionId
        );

        Ok(transaction_account.status)
    }

    /// Update protection settings
    pub fn update_settings(
        ctx: Context<UpdateSettings>,
        max_slippage: u16,
        max_mev_risk: u8,
    ) -> Result<()> {
        let protection_account = &mut ctx.accounts.protection_account;

        require!(max_slippage <= 1000, ErrorCode::InvalidSlippage); // Max 10%
        require!(max_mev_risk <= 100, ErrorCode::InvalidRiskScore);

        protection_account.settings.max_slippage_bps = max_slippage;
        protection_account.settings.max_mev_risk_score = max_mev_risk;

        emit!(SettingsUpdated {
            owner: protection_account.owner,
            max_slippage_bps: max_slippage,
            max_mev_risk_score: max_mev_risk,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Update transaction with AI risk analysis results
    pub fn update_risk_analysis(
        ctx: Context<UpdateRiskAnalysis>,
        transaction_id: [u8; 32],
        risk_score: u8,
        mev_detected: bool,
    ) -> Result<()> {
        let transaction_account = &mut ctx.accounts.transaction_account;
        let protection_account = &mut ctx.accounts.protection_account;

        require!(
            transaction_account.id == transaction_id,
            ErrorCode::InvalidTransactionId
        );
        require!(risk_score <= 100, ErrorCode::InvalidRiskScore);

        transaction_account.risk_score = risk_score;
        transaction_account.status = TransactionStatus::Analyzing;

        if mev_detected {
            protection_account.mev_attacks_blocked += 1;
            
            emit!(MEVDetected {
                transaction_id,
                attack_type: "Sandwich Attack".to_string(),
                risk_score,
                timestamp: Clock::get()?.unix_timestamp,
            });
        }

        Ok(())
    }

    /// Complete transaction execution
    pub fn complete_transaction(
        ctx: Context<CompleteTransaction>,
        transaction_id: [u8; 32],
        output_amount: u64,
        proof_hash: [u8; 32],
    ) -> Result<()> {
        let transaction_account = &mut ctx.accounts.transaction_account;
        let protection_account = &mut ctx.accounts.protection_account;
        let clock = Clock::get()?;

        require!(
            transaction_account.id == transaction_id,
            ErrorCode::InvalidTransactionId
        );

        transaction_account.output_amount = output_amount;
        transaction_account.proof_hash = proof_hash;
        transaction_account.status = TransactionStatus::Completed;
        transaction_account.completed_at = Some(clock.unix_timestamp);

        // Calculate savings (simplified - in production this would be more complex)
        let savings = if output_amount > transaction_account.input_amount {
            output_amount - transaction_account.input_amount
        } else {
            0
        };

        protection_account.total_savings += savings;

        emit!(TransactionCompleted {
            transaction_id,
            output_amount,
            savings,
            risk_score: transaction_account.risk_score,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

/// Generate unique transaction ID
fn generate_transaction_id(
    owner: &Pubkey,
    input_token: &Pubkey,
    output_token: &Pubkey,
    input_amount: u64,
    timestamp: i64,
) -> [u8; 32] {
    // Generate ID by XOR-ing all inputs into 32 bytes
    let mut id = [0u8; 32];
    
    // XOR owner pubkey
    for (i, byte) in owner.to_bytes().iter().enumerate() {
        id[i] ^= byte;
    }
    
    // XOR input_token (with offset to mix better)
    for (i, byte) in input_token.to_bytes().iter().enumerate() {
        id[(i + 8) % 32] ^= byte;
    }
    
    // XOR output_token (with different offset)
    for (i, byte) in output_token.to_bytes().iter().enumerate() {
        id[(i + 16) % 32] ^= byte;
    }
    
    // XOR amount and timestamp
    let amount_bytes = input_amount.to_le_bytes();
    let timestamp_bytes = timestamp.to_le_bytes();
    for i in 0..8 {
        id[i + 24] ^= amount_bytes[i] ^ timestamp_bytes[i];
    }
    
    id
}

#[derive(Accounts)]
#[instruction(wallet_address: Pubkey)]
pub struct InitializeProtection<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + ProtectionAccount::INIT_SPACE,
        seeds = [b"protection", wallet_address.as_ref()],
        bump
    )]
    pub protection_account: Account<'info, ProtectionAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(input_token: Pubkey, output_token: Pubkey, input_amount: u64, min_output_amount: u64)]
pub struct SubmitTransaction<'info> {
    #[account(
        mut,
        seeds = [b"protection", protection_account.owner.as_ref()],
        bump = protection_account.bump
    )]
    pub protection_account: Account<'info, ProtectionAccount>,
    #[account(
        init,
        payer = payer,
        space = 8 + Transaction::INIT_SPACE,
        seeds = [b"transaction", protection_account.owner.as_ref(), &generate_transaction_id(&protection_account.owner, &input_token, &output_token, input_amount, Clock::get().unwrap().unix_timestamp)],
        bump
    )]
    pub transaction_account: Account<'info, Transaction>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(transaction_id: [u8; 32])]
pub struct GetTransactionStatus<'info> {
    #[account(
        seeds = [b"protection", protection_account.owner.as_ref()],
        bump = protection_account.bump
    )]
    pub protection_account: Account<'info, ProtectionAccount>,
    #[account(
        seeds = [b"transaction", protection_account.owner.as_ref(), &transaction_id],
        bump
    )]
    pub transaction_account: Account<'info, Transaction>,
}

#[derive(Accounts)]
#[instruction(max_slippage: u16, max_mev_risk: u8)]
pub struct UpdateSettings<'info> {
    #[account(
        mut,
        seeds = [b"protection", protection_account.owner.as_ref()],
        bump = protection_account.bump,
        constraint = protection_account.owner == payer.key()
    )]
    pub protection_account: Account<'info, ProtectionAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(transaction_id: [u8; 32], risk_score: u8, mev_detected: bool)]
pub struct UpdateRiskAnalysis<'info> {
    #[account(
        mut,
        seeds = [b"protection", protection_account.owner.as_ref()],
        bump = protection_account.bump
    )]
    pub protection_account: Account<'info, ProtectionAccount>,
    #[account(
        mut,
        seeds = [b"transaction", protection_account.owner.as_ref(), &transaction_id],
        bump
    )]
    pub transaction_account: Account<'info, Transaction>,
}

#[derive(Accounts)]
#[instruction(transaction_id: [u8; 32], output_amount: u64, proof_hash: [u8; 32])]
pub struct CompleteTransaction<'info> {
    #[account(
        mut,
        seeds = [b"protection", protection_account.owner.as_ref()],
        bump = protection_account.bump
    )]
    pub protection_account: Account<'info, ProtectionAccount>,
    #[account(
        mut,
        seeds = [b"transaction", protection_account.owner.as_ref(), &transaction_id],
        bump
    )]
    pub transaction_account: Account<'info, Transaction>,
}

#[account]
#[derive(InitSpace)]
pub struct ProtectionAccount {
    pub owner: Pubkey,
    pub total_transactions: u64,
    pub total_savings: u64, // in lamports
    pub mev_attacks_blocked: u32,
    pub settings: ProtectionSettings,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct ProtectionSettings {
    pub max_slippage_bps: u16, // basis points (100 = 1%)
    pub max_mev_risk_score: u8, // 0-100
    pub auto_execute: bool,
    pub batch_enabled: bool,
}

#[account]
#[derive(InitSpace)]
pub struct Transaction {
    pub id: [u8; 32],
    pub owner: Pubkey,
    pub input_token: Pubkey,
    pub output_token: Pubkey,
    pub input_amount: u64,
    pub output_amount: u64,
    pub risk_score: u8,
    pub selected_route: u8, // 0=Jupiter, 1=Raydium, 2=Orca
    pub status: TransactionStatus,
    pub proof_hash: [u8; 32],
    pub batch_id: Option<[u8; 32]>,
    pub created_at: i64,
    pub completed_at: Option<i64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, InitSpace)]
pub enum TransactionStatus {
    Pending,
    Simulating,
    Analyzing,
    Executing,
    Completed,
    Failed,
}

#[event]
pub struct ProtectionInitialized {
    pub owner: Pubkey,
    pub timestamp: i64,
}

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

#[event]
pub struct SettingsUpdated {
    pub owner: Pubkey,
    pub max_slippage_bps: u16,
    pub max_mev_risk_score: u8,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid transaction ID")]
    InvalidTransactionId,
    #[msg("Invalid slippage percentage")]
    InvalidSlippage,
    #[msg("Invalid risk score")]
    InvalidRiskScore,
    #[msg("Transaction not found")]
    TransactionNotFound,
    #[msg("Unauthorized access")]
    Unauthorized,
}
