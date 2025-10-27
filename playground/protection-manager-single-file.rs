// Zephyra Protection Manager - Single File Version for Solana Playground
// Copy this entire file to Playground's src/lib.rs

use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod zephyra_protection_manager {
    use super::*;

    pub fn initialize_protection(
        ctx: Context<InitializeProtection>,
        wallet_address: Pubkey,
    ) -> Result<()> {
        let protection_account = &mut ctx.accounts.protection_account;
        protection_account.owner = wallet_address;
        protection_account.total_transactions = 0;
        protection_account.total_savings = 0;
        protection_account.mev_attacks_blocked = 0;
        protection_account.settings = ProtectionSettings {
            max_slippage_bps: 50,
            max_mev_risk_score: 70,
            auto_execute: true,
            batch_enabled: true,
        };
        protection_account.bump = ctx.bumps.protection_account;
        Ok(())
    }

    pub fn submit_transaction(
        ctx: Context<SubmitTransaction>,
        input_token: Pubkey,
        output_token: Pubkey,
        input_amount: u64,
        min_output_amount: u64,
    ) -> Result<[u8; 32]> {
        let transaction_account = &mut ctx.accounts.transaction_account;
        let protection_account = &mut ctx.accounts.protection_account;

        let transaction_id = *transaction_account.to_account_info().key.as_ref();

        transaction_account.id = transaction_id;
        transaction_account.owner = ctx.accounts.owner.key();
        transaction_account.input_token = input_token;
        transaction_account.output_token = output_token;
        transaction_account.input_amount = input_amount;
        transaction_account.output_amount = min_output_amount;
        transaction_account.risk_score = 0;
        transaction_account.selected_route = 0;
        transaction_account.status = TransactionStatus::Pending;
        transaction_account.proof_hash = [0; 32];
        transaction_account.batch_id = None;
        transaction_account.created_at = Clock::get()?.unix_timestamp;
        transaction_account.completed_at = None;

        protection_account.total_transactions += 1;

        emit!(TransactionSubmitted {
            transaction_id,
            owner: ctx.accounts.owner.key(),
            input_token,
            output_token,
            input_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(transaction_id)
    }

    pub fn update_settings(
        ctx: Context<UpdateSettings>,
        max_slippage: u16,
        max_mev_risk: u8,
    ) -> Result<()> {
        let protection_account = &mut ctx.accounts.protection_account;
        protection_account.settings.max_slippage_bps = max_slippage;
        protection_account.settings.max_mev_risk_score = max_mev_risk;
        Ok(())
    }
}

// Account Structures
#[account]
#[derive(InitSpace)]
pub struct ProtectionAccount {
    pub owner: Pubkey,
    pub total_transactions: u64,
    pub total_savings: u64,
    pub mev_attacks_blocked: u32,
    pub settings: ProtectionSettings,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct ProtectionSettings {
    pub max_slippage_bps: u16,
    pub max_mev_risk_score: u8,
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

// Context Structures
#[derive(Accounts)]
#[instruction(wallet_address: Pubkey)]
pub struct InitializeProtection<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + ProtectionAccount::INIT_SPACE,
        seeds = [b"protection", wallet_address.as_ref()],
        bump
    )]
    pub protection_account: Account<'info, ProtectionAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitTransaction<'info> {
    #[account(mut, has_one = owner)]
    pub protection_account: Account<'info, ProtectionAccount>,
    #[account(
        init,
        payer = owner,
        space = 8 + Transaction::INIT_SPACE
    )]
    pub transaction_account: Account<'info, Transaction>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateSettings<'info> {
    #[account(mut, has_one = owner)]
    pub protection_account: Account<'info, ProtectionAccount>,
    pub owner: Signer<'info>,
}

// Events
#[event]
pub struct TransactionSubmitted {
    pub transaction_id: [u8; 32],
    pub owner: Pubkey,
    pub input_token: Pubkey,
    pub output_token: Pubkey,
    pub input_amount: u64,
    pub timestamp: i64,
}
