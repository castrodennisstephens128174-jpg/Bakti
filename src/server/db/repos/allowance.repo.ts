import { and, desc, eq } from 'drizzle-orm';
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

  async listByOwner(publicKey: string): Promise<Allowance[]> {
    return db
      .select()
      .from(allowances)
      .where(eq(allowances.publicKey, publicKey))
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

  async setStatus(id: string, status: AllowanceStatus): Promise<Allowance> {
    const [row] = await db
      .update(allowances)
      .set({ status })
      .where(eq(allowances.id, id))
      .returning();
    return row;
  },
};
