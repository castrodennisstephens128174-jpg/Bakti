import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const ALLOWANCE_ASSETS = ['XLM', 'USDC'] as const;
export type AllowanceAsset = (typeof ALLOWANCE_ASSETS)[number];
export const allowanceAssetEnum = pgEnum('allowance_asset', ALLOWANCE_ASSETS);

export const ALLOWANCE_STATUSES = ['active', 'paused', 'ended'] as const;
export type AllowanceStatus = (typeof ALLOWANCE_STATUSES)[number];
export const allowanceStatusEnum = pgEnum('allowance_status', ALLOWANCE_STATUSES);

/**
 * A standing monthly allowance a working child sets up for a parent back home.
 * Owned by the connecting wallet (publicKey = the sender). It is a plan, not a
 * transfer: each month it produces one payout that the sender signs on-chain.
 */
export const allowances = pgTable(
  'allowances',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    publicKey: text('public_key').notNull(),
    recipientName: text('recipient_name').notNull(),
    recipientAddress: text('recipient_address').notNull(),
    corridor: text('corridor').notNull(),
    asset: allowanceAssetEnum('asset').notNull().default('XLM'),
    monthlyAmount: text('monthly_amount').notNull(),
    dayOfMonth: integer('day_of_month').notNull().default(1),
    months: integer('months').notNull().default(3),
    scheduleId: text('schedule_id'),
    contractId: text('contract_id'),
    escrowTxHash: text('escrow_tx_hash'),
    status: allowanceStatusEnum('status').notNull().default('active'),
    note: text('note'),
    network: text('network').notNull().default('public'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ ownerIdx: index('allowances_owner_idx').on(t.publicKey) }),
);

export type Allowance = typeof allowances.$inferSelect;
export type NewAllowance = typeof allowances.$inferInsert;
