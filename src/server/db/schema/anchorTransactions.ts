import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { anchorCustomers } from './anchorCustomers';

export const anchorTransactions = pgTable('anchor_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  status: text('status').notNull().default('pending_sender'),
  amountIn: text('amount_in').notNull(),
  assetCode: text('asset_code').notNull(),
  receiverId: uuid('receiver_id')
    .notNull()
    .references(() => anchorCustomers.id),
  fundingMethod: text('funding_method').notNull(),
  stellarAccountId: text('stellar_account_id').notNull(),
  stellarMemo: text('stellar_memo').notNull(),
  stellarMemoType: text('stellar_memo_type').notNull().default('id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type AnchorTransaction = typeof anchorTransactions.$inferSelect;
export type NewAnchorTransaction = typeof anchorTransactions.$inferInsert;
