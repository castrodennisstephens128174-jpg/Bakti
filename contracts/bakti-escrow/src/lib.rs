#![no_std]
//! # Bakti Allowance Escrow
//!
//! A cross-border parent-allowance schedule on Soroban. The sender pre-funds the
//! whole run up front (`monthly_amount * months` escrowed into the contract), and
//! each period a `release` pays exactly one month to the recipient. `release` is
//! permissionless: any caller can trigger a due period (a keeper pattern), and
//! the recipient is always the fund destination regardless of who calls.
//!
//! ## Demo cadence
//! `LEDGERS_PER_PERIOD` is a SHORT testnet-demo cadence (~5 minutes of ledgers),
//! NOT a real 30-day month. It is deliberately tiny so a live demo can release a
//! second period within minutes instead of a month. A production deploy would set
//! this to ~30 days of ledgers (30 * 17_280 = 518_400).

mod error;
mod storage;
mod types;

#[cfg(test)]
mod test;

pub use error::Error;
use storage::{
    DataKey, INSTANCE_BUMP_AMOUNT, INSTANCE_LIFETIME_THRESHOLD, SCHEDULE_BUMP_AMOUNT,
    SCHEDULE_LIFETIME_THRESHOLD,
};
pub use types::Schedule;

use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, Env};

/// Ledgers between allowance periods. Soroban ledgers close ~every 5s, so 60
/// ledgers is ~5 minutes — a testnet-demo cadence, not a real 30-day month.
pub const LEDGERS_PER_PERIOD: u32 = 60;

#[contract]
pub struct BaktiEscrow;

#[contractimpl]
impl BaktiEscrow {
    pub fn initialize(env: Env, admin: Address, token: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::NextId, &0u64);
        bump_instance(&env);
        env.events().publish((symbol_short!("init"),), admin);
        Ok(())
    }

    pub fn create_schedule(
        env: Env,
        sender: Address,
        recipient: Address,
        monthly_amount: i128,
        months: u32,
        first_due_ledger: u32,
    ) -> Result<u64, Error> {
        sender.require_auth();
        if monthly_amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if months == 0 {
            return Err(Error::InvalidMonths);
        }

        let total = monthly_amount * (months as i128);
        let client = token::Client::new(&env, &token_address(&env)?);
        client.transfer(&sender, &env.current_contract_address(), &total);

        let id = next_id(&env);
        let schedule = Schedule {
            sender: sender.clone(),
            recipient: recipient.clone(),
            monthly_amount,
            months,
            periods_released: 0,
            next_due_ledger: first_due_ledger,
        };
        save_schedule(&env, id, &schedule);

        env.events()
            .publish((symbol_short!("created"), id), (sender, recipient, total, months));
        Ok(id)
    }

    pub fn release(env: Env, schedule_id: u64, caller: Address) -> Result<u32, Error> {
        caller.require_auth();
        let mut schedule = load_schedule(&env, schedule_id)?;

        if schedule.periods_released >= schedule.months {
            return Err(Error::AllReleased);
        }
        if env.ledger().sequence() < schedule.next_due_ledger {
            return Err(Error::NotDueYet);
        }

        let client = token::Client::new(&env, &token_address(&env)?);
        client.transfer(
            &env.current_contract_address(),
            &schedule.recipient,
            &schedule.monthly_amount,
        );

        schedule.periods_released += 1;
        schedule.next_due_ledger += LEDGERS_PER_PERIOD;
        save_schedule(&env, schedule_id, &schedule);

        env.events().publish(
            (symbol_short!("released"), schedule_id),
            (schedule.recipient.clone(), schedule.monthly_amount, schedule.periods_released),
        );
        Ok(schedule.periods_released)
    }

    pub fn schedule_status(env: Env, schedule_id: u64) -> Result<(i128, u32, u32, u32), Error> {
        let s = load_schedule(&env, schedule_id)?;
        Ok((s.monthly_amount, s.months, s.periods_released, s.next_due_ledger))
    }

    pub fn get_schedule(env: Env, schedule_id: u64) -> Result<Schedule, Error> {
        load_schedule(&env, schedule_id)
    }

    pub fn get_admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_token(env: Env) -> Result<Address, Error> {
        token_address(&env)
    }
}

fn token_address(env: &Env) -> Result<Address, Error> {
    env.storage()
        .instance()
        .get(&DataKey::Token)
        .ok_or(Error::NotInitialized)
}

fn next_id(env: &Env) -> u64 {
    let id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap_or(0);
    env.storage().instance().set(&DataKey::NextId, &(id + 1));
    bump_instance(env);
    id
}

fn load_schedule(env: &Env, schedule_id: u64) -> Result<Schedule, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Schedule(schedule_id))
        .ok_or(Error::ScheduleNotFound)
}

fn save_schedule(env: &Env, schedule_id: u64, schedule: &Schedule) {
    let key = DataKey::Schedule(schedule_id);
    env.storage().persistent().set(&key, schedule);
    env.storage()
        .persistent()
        .extend_ttl(&key, SCHEDULE_LIFETIME_THRESHOLD, SCHEDULE_BUMP_AMOUNT);
}

fn bump_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}
