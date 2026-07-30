import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * One row per reconciliation run: the daily three-ledger check (our DB vs the
 * anchor's order book vs the chain). `ok = false` rows carry the details of
 * what disagreed — those are the rows that page a human.
 */
export const reconciliationRuns = pgTable('reconciliation_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  checked: integer('checked').notNull().default(0),
  settledOk: integer('settled_ok').notNull().default(0),
  stuck: integer('stuck').notNull().default(0),
  mismatched: integer('mismatched').notNull().default(0),
  ok: boolean('ok').notNull().default(true),
  detailsJson: text('details_json').notNull().default('[]'),
  ranAt: timestamp('ran_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ReconciliationRun = typeof reconciliationRuns.$inferSelect;
