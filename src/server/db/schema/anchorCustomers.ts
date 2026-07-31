import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const anchorCustomers = pgTable('anchor_customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull(),
  fields: jsonb('fields').$type<Record<string, string>>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type AnchorCustomer = typeof anchorCustomers.$inferSelect;
export type NewAnchorCustomer = typeof anchorCustomers.$inferInsert;
