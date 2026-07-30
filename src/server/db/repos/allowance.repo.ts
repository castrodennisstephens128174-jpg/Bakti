import { and, desc, eq, isNotNull, lte } from 'drizzle-orm';
import { db } from '@/server/db/client';
import {
  type Allowance,
  type AllowanceStatus,
  allowances,
  type NewAllowance,
} from '@/server/db/schema';

export const allowanceRepo = {
  async insert(row: NewAllowance): Promise<Allowance> {
    const [created] = await db.insert(allowances).values(row).returning();
    return created;
  },

  async listByOwner(publicKey: string, network?: string): Promise<Allowance[]> {
    const owner = eq(allowances.publicKey, publicKey);
    return db
      .select()
      .from(allowances)
      .where(network ? and(owner, eq(allowances.network, network)) : owner)
      .orderBy(desc(allowances.createdAt));
  },

  async findOwned(id: string, publicKey: string): Promise<Allowance | undefined> {
    const [row] = await db
      .select()
      .from(allowances)
      .where(and(eq(allowances.id, id), eq(allowances.publicKey, publicKey)))
      .limit(1);
    return row;
  },

  /** Escrow-backed SEP-31 allowances whose payout day has arrived. */
  async findDueSep31(network: string, dayOfMonth: number): Promise<Allowance[]> {
    return db
      .select()
      .from(allowances)
      .where(
        and(
          eq(allowances.corridor, 'sep31'),
          eq(allowances.status, 'active'),
          eq(allowances.network, network),
          isNotNull(allowances.scheduleId),
          lte(allowances.dayOfMonth, dayOfMonth),
        ),
      )
      .orderBy(desc(allowances.createdAt));
  },

  async setKyc(id: string, kycJson: string): Promise<Allowance> {
    const [row] = await db
      .update(allowances)
      .set({ kycJson })
      .where(eq(allowances.id, id))
      .returning();
    return row;
  },

  async setStatus(id: string, status: AllowanceStatus): Promise<Allowance> {
    const [row] = await db
      .update(allowances)
      .set({ status })
      .where(eq(allowances.id, id))
      .returning();
    return row;
  },
};
