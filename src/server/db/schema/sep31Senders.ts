import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * One SEP-12 sender registration per wallet: the anchor-side customer id for
 * the sending user. Registered once, reused by every allowance the wallet
 * creates — the anchor keeps the PII, bakti keeps only this pointer.
 */
export const sep31Senders = pgTable('sep31_senders', {
  publicKey: text('public_key').primaryKey(),
  customerId: text('customer_id').notNull(),
  anchorDomain: text('anchor_domain').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Sep31Sender = typeof sep31Senders.$inferSelect;
