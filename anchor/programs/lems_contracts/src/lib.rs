use anchor_lang::prelude::*;

declare_id!("HrUtqhKQaoSmrccqgAsf6qN3sGYKq5zTcYzRkHrYiyNF");

#[program]
pub mod lems_contracts {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
