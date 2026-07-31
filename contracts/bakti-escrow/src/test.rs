#![cfg(test)]

use crate::{BaktiEscrow, BaktiEscrowClient, Error, LEDGERS_PER_PERIOD};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};

const START_LEDGER: u32 = 1_000;
const MONTHLY: i128 = 10_000_000;

struct Harness {
    env: Env,
    sender: Address,
    recipient: Address,
    outsider: Address,
    token: TokenClient<'static>,
    escrow: BaktiEscrowClient<'static>,
}

fn setup() -> Harness {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.sequence_number = START_LEDGER);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let outsider = Address::generate(&env);

    let issuer = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(issuer);
    let token_id = sac.address();
    StellarAssetClient::new(&env, &token_id).mint(&sender, &1_000_000_000);

    let contract_id = env.register(BaktiEscrow, ());
    let escrow = BaktiEscrowClient::new(&env, &contract_id);
    escrow.initialize(&admin, &token_id);

    let token = TokenClient::new(&env, &token_id);

    Harness {
        env,
        sender,
        recipient,
        outsider,
        token,
        escrow,
    }
}

fn advance_to(env: &Env, ledger: u32) {
    env.ledger().with_mut(|li| li.sequence_number = ledger);
}

#[test]
fn test_create_schedule_escrows_full_run() {
    let h = setup();
    let months = 3u32;
    let id = h
        .escrow
        .create_schedule(&h.sender, &h.recipient, &MONTHLY, &months, &START_LEDGER);

    let total = MONTHLY * months as i128;
    assert_eq!(id, 0);
    assert_eq!(h.token.balance(&h.sender), 1_000_000_000 - total);
    assert_eq!(h.token.balance(&h.escrow.address), total);
    assert_eq!(h.token.balance(&h.recipient), 0);

    let (monthly, m, released, next_due) = h.escrow.schedule_status(&id);
    assert_eq!(monthly, MONTHLY);
    assert_eq!(m, months);
    assert_eq!(released, 0);
    assert_eq!(next_due, START_LEDGER);
}

#[test]
fn test_release_before_due_fails() {
    let h = setup();
    let future = START_LEDGER + 100;
    let id = h
        .escrow
        .create_schedule(&h.sender, &h.recipient, &MONTHLY, &3u32, &future);
    let res = h.escrow.try_release(&id, &h.sender);
    assert_eq!(res, Err(Ok(Error::NotDueYet)));
    assert_eq!(h.token.balance(&h.recipient), 0);
}

#[test]
fn test_release_after_due_pays_recipient() {
    let h = setup();
    let id = h
        .escrow
        .create_schedule(&h.sender, &h.recipient, &MONTHLY, &3u32, &START_LEDGER);
    let total = MONTHLY * 3;

    let period = h.escrow.release(&id, &h.sender);
    assert_eq!(period, 1);
    assert_eq!(h.token.balance(&h.recipient), MONTHLY);
    assert_eq!(h.token.balance(&h.escrow.address), total - MONTHLY);

    let (_, _, released, next_due) = h.escrow.schedule_status(&id);
    assert_eq!(released, 1);
    assert_eq!(next_due, START_LEDGER + LEDGERS_PER_PERIOD);
}

#[test]
fn test_release_all_periods_then_all_released() {
    let h = setup();
    let months = 2u32;
    let id = h
        .escrow
        .create_schedule(&h.sender, &h.recipient, &MONTHLY, &months, &START_LEDGER);

    h.escrow.release(&id, &h.sender);
    advance_to(&h.env, START_LEDGER + LEDGERS_PER_PERIOD);
    h.escrow.release(&id, &h.sender);

    advance_to(&h.env, START_LEDGER + 10 * LEDGERS_PER_PERIOD);
    let res = h.escrow.try_release(&id, &h.sender);
    assert_eq!(res, Err(Ok(Error::AllReleased)));
    assert_eq!(h.token.balance(&h.recipient), MONTHLY * months as i128);
    assert_eq!(h.token.balance(&h.escrow.address), 0);
}

#[test]
fn test_release_is_permissionless() {
    let h = setup();
    let id = h
        .escrow
        .create_schedule(&h.sender, &h.recipient, &MONTHLY, &3u32, &START_LEDGER);

    let period = h.escrow.release(&id, &h.outsider);
    assert_eq!(period, 1);
    assert_eq!(h.token.balance(&h.recipient), MONTHLY);
    assert_eq!(h.token.balance(&h.outsider), 0);
}

#[test]
fn test_schedule_status_after_two_releases() {
    let h = setup();
    let id = h
        .escrow
        .create_schedule(&h.sender, &h.recipient, &MONTHLY, &4u32, &START_LEDGER);

    h.escrow.release(&id, &h.sender);
    advance_to(&h.env, START_LEDGER + LEDGERS_PER_PERIOD);
    h.escrow.release(&id, &h.sender);

    let (monthly, months, released, next_due) = h.escrow.schedule_status(&id);
    assert_eq!(monthly, MONTHLY);
    assert_eq!(months, 4);
    assert_eq!(released, 2);
    assert_eq!(next_due, START_LEDGER + 2 * LEDGERS_PER_PERIOD);
    assert_eq!(h.token.balance(&h.recipient), MONTHLY * 2);
}

#[test]
fn test_initialize_twice_fails() {
    let h = setup();
    let admin = Address::generate(&h.env);
    let token = h.escrow.get_token();
    assert_eq!(
        h.escrow.try_initialize(&admin, &token),
        Err(Ok(Error::AlreadyInitialized))
    );
}

#[test]
fn test_create_schedule_rejects_bad_input() {
    let h = setup();
    assert_eq!(
        h.escrow
            .try_create_schedule(&h.sender, &h.recipient, &0i128, &3u32, &START_LEDGER),
        Err(Ok(Error::InvalidAmount))
    );
    assert_eq!(
        h.escrow
            .try_create_schedule(&h.sender, &h.recipient, &MONTHLY, &0u32, &START_LEDGER),
        Err(Ok(Error::InvalidMonths))
    );
}

#[test]
fn test_status_of_unknown_schedule_fails() {
    let h = setup();
    assert_eq!(h.escrow.try_schedule_status(&999u64), Err(Ok(Error::ScheduleNotFound)));
}
