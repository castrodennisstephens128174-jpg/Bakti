use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Schedule {
    pub sender: Address,
    pub recipient: Address,
    pub monthly_amount: i128,
    pub months: u32,
    pub periods_released: u32,
    pub next_due_ledger: u32,
}
