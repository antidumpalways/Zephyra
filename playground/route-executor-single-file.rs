// Zephyra Route Executor - Single File Version for Solana Playground
// Copy this entire file to Playground's src/lib.rs

use anchor_lang::prelude::*;

declare_id!("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");

#[program]
pub mod zephyra_route_executor {
    use super::*;

    pub fn select_best_route(
        _ctx: Context<SelectRoute>,
        routes: Vec<RouteOption>,
    ) -> Result<RouteSelection> {
        let mut best_route: Option<&RouteOption> = None;
        for route in routes.iter() {
            if best_route.is_none() ||
               (route.mev_risk_score < best_route.unwrap().mev_risk_score) ||
               (route.mev_risk_score == best_route.unwrap().mev_risk_score && 
                route.estimated_output > best_route.unwrap().estimated_output) {
                best_route = Some(route);
            }
        }

        let selected = best_route.unwrap();

        emit!(RouteSelected {
            selected_dex: selected.dex.clone(),
            estimated_output: selected.estimated_output,
            mev_risk: selected.mev_risk_score,
        });

        Ok(RouteSelection {
            selected_dex: selected.dex.clone(),
            estimated_output: selected.estimated_output,
            reasoning: "Optimal route selected based on MEV risk and output".to_string(),
        })
    }
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct RouteSelection {
    pub selected_dex: DEX,
    pub estimated_output: u64,
    #[max_len(200)]
    pub reasoning: String,
}

#[derive(Accounts)]
pub struct SelectRoute<'info> {
    pub signer: Signer<'info>,
}

#[event]
pub struct RouteSelected {
    pub selected_dex: DEX,
    pub estimated_output: u64,
    pub mev_risk: u8,
}
