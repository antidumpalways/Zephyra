use anchor_lang::prelude::*;

declare_id!("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");

/// Zephyra Batch Coordinator Program
/// Coordinate multiple transactions for efficient execution
#[program]
pub mod batch_coordinator {
    use super::*;

    /// Create new batch
    pub fn create_batch(ctx: Context<CreateBatch>) -> Result<[u8; 32]> {
        let batch_account = &mut ctx.accounts.batch_account;
        let clock = Clock::get()?;

        // Generate unique batch ID
        let batch_id = generate_batch_id(&ctx.accounts.authority.key(), clock.unix_timestamp);

        // Initialize batch account
        batch_account.id = batch_id;
        batch_account.transactions = Vec::new();
        batch_account.transaction_count = 0;
        batch_account.total_value = 0;
        batch_account.status = BatchStatus::Pending;
        batch_account.created_at = clock.unix_timestamp;
        batch_account.executed_at = None;
        batch_account.completed_at = None;
        batch_account.execution_time_ms = None;
        batch_account.batch_hash = generate_batch_hash(&batch_id, clock.unix_timestamp);

        emit!(BatchCreated {
            batch_id,
            timestamp: clock.unix_timestamp,
        });

        Ok(batch_id)
    }

    /// Add transaction to batch
    pub fn add_to_batch(
        ctx: Context<AddToBatch>,
        batch_id: [u8; 32],
        transaction_id: [u8; 32],
    ) -> Result<()> {
        let batch_account = &mut ctx.accounts.batch_account;
        let transaction_account = &ctx.accounts.transaction_account;
        let clock = Clock::get()?;

        require!(
            batch_account.id == batch_id,
            ErrorCode::InvalidBatchId
        );
        require!(
            batch_account.status == BatchStatus::Pending,
            ErrorCode::BatchNotPending
        );
        require!(
            batch_account.transaction_count < MAX_BATCH_SIZE,
            ErrorCode::BatchFull
        );

        // Add transaction to batch
        batch_account.transactions.push(transaction_id);
        batch_account.transaction_count += 1;
        batch_account.total_value += transaction_account.input_amount;

        // Update transaction's batch reference
        // Note: In a real implementation, you'd need to update the transaction account
        // This would require cross-program invocation to the protection manager

        emit!(TransactionAddedToBatch {
            batch_id,
            transaction_id,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Execute batch
    pub fn execute_batch(
        ctx: Context<ExecuteBatch>,
        batch_id: [u8; 32],
    ) -> Result<BatchExecutionResult> {
        let batch_account = &mut ctx.accounts.batch_account;
        let clock = Clock::get()?;

        require!(
            batch_account.id == batch_id,
            ErrorCode::InvalidBatchId
        );
        require!(
            batch_account.status == BatchStatus::Pending,
            ErrorCode::BatchNotPending
        );
        require!(
            batch_account.transaction_count > 0,
            ErrorCode::EmptyBatch
        );

        // Mark batch as processing
        batch_account.status = BatchStatus::Processing;
        batch_account.executed_at = Some(clock.unix_timestamp);

        // Simulate batch execution
        let execution_start = Clock::get()?.unix_timestamp;
        
        // In production, this would:
        // 1. Coordinate with Route Executor for each transaction
        // 2. Execute transactions in parallel where possible
        // 3. Handle failures gracefully
        // 4. Update transaction statuses
        
        let successful_txs = batch_account.transaction_count; // Simplified - assume all succeed
        let failed_txs = 0;
        let total_savings = calculate_batch_savings(batch_account);
        
        let execution_time_ms = (Clock::get()?.unix_timestamp - execution_start) as u32 * 1000;

        // Mark batch as completed
        batch_account.status = BatchStatus::Completed;
        batch_account.completed_at = Some(clock.unix_timestamp);
        batch_account.execution_time_ms = Some(execution_time_ms);

        let result = BatchExecutionResult {
            batch_id,
            successful_txs,
            failed_txs,
            total_savings,
            execution_time_ms,
        };

        emit!(BatchExecuted {
            batch_id,
            transaction_count: batch_account.transaction_count,
            total_value: batch_account.total_value,
            execution_time_ms,
            timestamp: clock.unix_timestamp,
        });

        Ok(result)
    }

    /// Get batch status
    pub fn get_batch_status(
        ctx: Context<GetBatchStatus>,
        batch_id: [u8; 32],
    ) -> Result<BatchStatus> {
        let batch_account = &ctx.accounts.batch_account;

        require!(
            batch_account.id == batch_id,
            ErrorCode::InvalidBatchId
        );

        Ok(batch_account.status)
    }

    /// Force execute batch (for time-based execution)
    pub fn force_execute_batch(
        ctx: Context<ForceExecuteBatch>,
        batch_id: [u8; 32],
    ) -> Result<BatchExecutionResult> {
        let batch_account = &mut ctx.accounts.batch_account;
        let clock = Clock::get()?;

        require!(
            batch_account.id == batch_id,
            ErrorCode::InvalidBatchId
        );
        require!(
            batch_account.status == BatchStatus::Pending,
            ErrorCode::BatchNotPending
        );

        // Check if batch is old enough to force execute
        let batch_age = clock.unix_timestamp - batch_account.created_at;
        require!(
            batch_age >= MIN_BATCH_AGE_SECONDS,
            ErrorCode::BatchTooYoung
        );

        // Execute the batch - reuse execute_batch logic
        let batch_account = &mut ctx.accounts.batch_account;
        require!(batch_account.status == BatchStatus::Pending, ErrorCode::BatchNotPending);

        batch_account.status = BatchStatus::Processing;
        batch_account.executed_at = Some(Clock::get()?.unix_timestamp);

        // Simulate execution
        let execution_time_ms = 100;
        let successful_txs = batch_account.transaction_count;
        let failed_txs = 0;
        let total_savings = 1000000;

        batch_account.status = BatchStatus::Completed;
        batch_account.completed_at = Some(Clock::get()?.unix_timestamp);
        batch_account.execution_time_ms = Some(execution_time_ms);
        
        // Generate batch hash
        let executed_at = batch_account.executed_at.unwrap();
        batch_account.batch_hash = generate_batch_hash(&batch_account.id, executed_at);

        emit!(BatchExecuted {
            batch_id: batch_account.id,
            transaction_count: batch_account.transaction_count,
            total_value: batch_account.total_value,
            execution_time_ms,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(BatchExecutionResult {
            batch_id: batch_account.id,
            successful_txs,
            failed_txs,
            total_savings,
            execution_time_ms,
        })
    }

    /// Cancel batch (if needed)
    pub fn cancel_batch(
        ctx: Context<CancelBatch>,
        batch_id: [u8; 32],
    ) -> Result<()> {
        let batch_account = &mut ctx.accounts.batch_account;

        require!(
            batch_account.id == batch_id,
            ErrorCode::InvalidBatchId
        );
        require!(
            batch_account.status == BatchStatus::Pending,
            ErrorCode::BatchNotPending
        );

        batch_account.status = BatchStatus::Failed;

        emit!(BatchCancelled {
            batch_id,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

/// Generate unique batch ID
fn generate_batch_id(authority: &Pubkey, timestamp: i64) -> [u8; 32] {
    let mut id = [0u8; 32];
    let slot = Clock::get().unwrap().slot;
    
    // XOR authority
    for (i, byte) in authority.to_bytes().iter().enumerate() {
        id[i] ^= byte;
    }
    
    // XOR timestamp
    let timestamp_bytes = timestamp.to_le_bytes();
    for (i, byte) in timestamp_bytes.iter().enumerate() {
        id[(i + 8) % 32] ^= byte;
    }
    
    // XOR slot
    let slot_bytes = slot.to_le_bytes();
    for (i, byte) in slot_bytes.iter().enumerate() {
        id[(i + 16) % 32] ^= byte;
    }
    
    id
}

/// Generate batch hash for verification
fn generate_batch_hash(batch_id: &[u8; 32], timestamp: i64) -> [u8; 32] {
    let mut hash = [0u8; 32];
    
    // XOR batch_id
    for (i, byte) in batch_id.iter().enumerate() {
        hash[i] ^= byte;
    }
    
    // XOR timestamp
    let timestamp_bytes = timestamp.to_le_bytes();
    for (i, byte) in timestamp_bytes.iter().enumerate() {
        hash[(i + 8) % 32] ^= byte;
    }
    
    hash
}

/// Calculate total savings for batch
fn calculate_batch_savings(batch_account: &Batch) -> u64 {
    // Simplified calculation - in production this would sum actual savings
    batch_account.total_value * 10 / 1000 // Assume 1% average savings
}

// Constants
const MAX_BATCH_SIZE: u32 = 10;
const MIN_BATCH_AGE_SECONDS: i64 = 30; // 30 seconds minimum age

#[derive(Accounts)]
pub struct CreateBatch<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Batch::INIT_SPACE,
        seeds = [b"batch", authority.key().as_ref(), &Clock::get().unwrap().unix_timestamp.to_le_bytes()],
        bump
    )]
    pub batch_account: Account<'info, Batch>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Authority that can manage batches
    pub authority: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(batch_id: [u8; 32], transaction_id: [u8; 32])]
pub struct AddToBatch<'info> {
    #[account(
        mut,
        seeds = [b"batch", authority.key().as_ref(), &batch_account.created_at.to_le_bytes()],
        bump
    )]
    pub batch_account: Account<'info, Batch>,
    #[account(
        seeds = [b"transaction", transaction_account.owner.as_ref(), &transaction_id],
        bump
    )]
    pub transaction_account: Account<'info, Transaction>,
    /// CHECK: Authority that can manage batches
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(batch_id: [u8; 32])]
pub struct ExecuteBatch<'info> {
    #[account(
        mut,
        seeds = [b"batch", authority.key().as_ref(), &batch_account.created_at.to_le_bytes()],
        bump
    )]
    pub batch_account: Account<'info, Batch>,
    /// CHECK: Authority that can execute batches
    pub authority: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(batch_id: [u8; 32])]
pub struct GetBatchStatus<'info> {
    #[account(
        seeds = [b"batch", authority.key().as_ref(), &batch_account.created_at.to_le_bytes()],
        bump
    )]
    pub batch_account: Account<'info, Batch>,
    /// CHECK: Authority that can query batches
    pub authority: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(batch_id: [u8; 32])]
pub struct ForceExecuteBatch<'info> {
    #[account(
        mut,
        seeds = [b"batch", authority.key().as_ref(), &batch_account.created_at.to_le_bytes()],
        bump
    )]
    pub batch_account: Account<'info, Batch>,
    /// CHECK: Authority that can force execute batches
    pub authority: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(batch_id: [u8; 32])]
pub struct CancelBatch<'info> {
    #[account(
        mut,
        seeds = [b"batch", authority.key().as_ref(), &batch_account.created_at.to_le_bytes()],
        bump
    )]
    pub batch_account: Account<'info, Batch>,
    /// CHECK: Authority that can cancel batches
    pub authority: UncheckedAccount<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Batch {
    pub id: [u8; 32],
    #[max_len(10)]
    pub transactions: Vec<[u8; 32]>, // transaction IDs (max 10)
    pub transaction_count: u32,
    pub total_value: u64, // in lamports
    pub status: BatchStatus,
    pub created_at: i64,
    pub executed_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub execution_time_ms: Option<u32>,
    pub batch_hash: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, InitSpace)]
pub enum BatchStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct BatchExecutionResult {
    pub batch_id: [u8; 32],
    pub successful_txs: u32,
    pub failed_txs: u32,
    pub total_savings: u64,
    pub execution_time_ms: u32,
}

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

#[event]
pub struct BatchCancelled {
    pub batch_id: [u8; 32],
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid batch ID")]
    InvalidBatchId,
    #[msg("Batch is not in pending status")]
    BatchNotPending,
    #[msg("Batch is full")]
    BatchFull,
    #[msg("Empty batch cannot be executed")]
    EmptyBatch,
    #[msg("Batch is too young to force execute")]
    BatchTooYoung,
    #[msg("Unauthorized access")]
    Unauthorized,
}

// Transaction struct (simplified version for cross-program compatibility)
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
    pub selected_route: u8,
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


