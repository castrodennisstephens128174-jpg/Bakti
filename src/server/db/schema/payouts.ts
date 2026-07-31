import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { allowances } from './allowances';

export const PAYOUT_STATUSES = ['scheduled', 'sent', 'settled', 'collected', 'failed'] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];
export const payoutStatusEnum = pgEnum('payout_status', PAYOUT_STATUSES);

/**
 * One payment record for an allowance period. `txHash` is the Horizon- or
 * RPC-confirmed on-chain transfer to the recipient. Current endpoints stop at
 * `sent`; `settled`, `collected`, and `pickupRef` are reserved for a future
 * provider adapter and must not be inferred from ledger confirmation.
 */
export const payouts = pgTable(
  'payouts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    allowanceId: uuid('allowance_id')
      .notNull()
      .references(() => allowances.id, { onDelete: 'cascade' }),
    publicKey: text('public_key').notNull(),
    asset: text('asset').notNull().default('XLM'),
    amount: text('amount').notNull(),
    period: text('period').notNull(),
    status: payoutStatusEnum('status').notNull().default('scheduled'),
    txHash: text('tx_hash').unique(),
    pickupRef: text('pickup_ref'),
    memo: text('memo').notNull().default(''),
    network: text('network').notNull().default('testnet'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    allowanceIdx: index('payouts_allowance_idx').on(t.allowanceId),
    ownerIdx: index('payouts_owner_idx').on(t.publicKey),
  }),
);

export type Payout = typeof payouts.$inferSelect;
export type NewPayout = typeof payouts.$inferInsert;
