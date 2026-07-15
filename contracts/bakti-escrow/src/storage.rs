use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    NextId,
    Schedule(u64),
}

pub const DAY_IN_LEDGERS: u32 = 17_280;

pub const INSTANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
pub const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

pub const SCHEDULE_BUMP_AMOUNT: u32 = 90 * DAY_IN_LEDGERS;
pub const SCHEDULE_LIFETIME_THRESHOLD: u32 = SCHEDULE_BUMP_AMOUNT - DAY_IN_LEDGERS;
