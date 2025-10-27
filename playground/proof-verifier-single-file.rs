// Zephyra Proof Verifier - Single File Version for Solana Playground
// Copy this entire file to Playground's src/lib.rs

use anchor_lang::prelude::*;

declare_id!("Cw8CFyM9FkoMi7KTYpkqXZ4e4v5X3sJ7W8dL2mN9pQrT");

#[program]
pub mod zephyra_proof_verifier {
    use super::*;

    pub fn generate_proof(
        ctx: Context<GenerateProof>,
        transaction_id: [u8; 32],
        routes_considered: Vec<RouteOption>,
        selected_route: DEX,
        reasoning: String,
    ) -> Result<[u8; 32]> {
        let proof_account = &mut ctx.accounts.proof_account;
        
        let proof_hash = anchor_lang::solana_program::hash::hashv(&[
            &transaction_id,
            &routes_considered.try_to_vec()?,
            &selected_route.try_to_vec()?,
            reasoning.as_bytes(),
            &Clock::get()?.unix_timestamp.to_le_bytes(),
        ]).to_bytes();

        proof_account.proof_hash = proof_hash;
        proof_account.transaction_id = transaction_id;
        proof_account.routes_considered = routes_considered;
        proof_account.selected_route = selected_route;
        proof_account.selection_reasoning = reasoning;
        proof_account.created_at = Clock::get()?.unix_timestamp;
        proof_account.bump = ctx.bumps.proof_account;

        emit!(ProofGenerated {
            proof_hash,
            transaction_id,
            routes_count: proof_account.routes_considered.len() as u8,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(proof_hash)
    }

    pub fn verify_proof(
        ctx: Context<VerifyProof>,
        proof_hash: [u8; 32],
    ) -> Result<bool> {
        let proof_account = &ctx.accounts.proof_account;
        let is_valid = proof_account.proof_hash == proof_hash;

        emit!(ProofVerified {
            proof_hash,
            valid: is_valid,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(is_valid)
    }
}

#[account]
#[derive(InitSpace)]
pub struct ProofOfRoute {
    pub proof_hash: [u8; 32],
    pub transaction_id: [u8; 32],
    #[max_len(10)]
    pub routes_considered: Vec<RouteOption>,
    pub selected_route: DEX,
    #[max_len(200)]
    pub selection_reasoning: String,
    pub created_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum DEX {
    Jupiter,
    Raydium,
    Orca,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct RouteOption {
    pub dex: DEX,
    pub estimated_output: u64,
    pub price_impact_bps: u16,
    pub mev_risk_score: u8,
    pub liquidity_depth: u64,
}

#[derive(Accounts)]
#[instruction(transaction_id: [u8; 32])]
pub struct GenerateProof<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + ProofOfRoute::INIT_SPACE,
        seeds = [b"proof", transaction_id.as_ref()],
        bump
    )]
    pub proof_account: Account<'info, ProofOfRoute>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(proof_hash: [u8; 32])]
pub struct VerifyProof<'info> {
    pub proof_account: Account<'info, ProofOfRoute>,
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
