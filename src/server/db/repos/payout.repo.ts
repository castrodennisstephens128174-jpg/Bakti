import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { type NewPayout, type Payout, type PayoutStatus, payouts } from '@/server/db/schema';

export const payoutRepo = {
  async insert(row: NewPayout): Promise<Payout> {
    const [created] = await db.insert(payouts).values(row).returning();
    return created;
  },

  async listByAllowance(allowanceId: string): Promise<Payout[]> {
    return db
      .select()
      .from(payouts)
      .where(eq(payouts.allowanceId, allowanceId))
      .orderBy(desc(payouts.createdAt));
  },

  async findOwned(id: string, publicKey: string): Promise<Payout | undefined> {
    const [row] = await db
      .select()
      .from(payouts)
      .where(and(eq(payouts.id, id), eq(payouts.publicKey, publicKey)))
      .limit(1);
    return row;
  },

  async findByTxHash(txHash: string): Promise<Payout | undefined> {
    const [row] = await db.select().from(payouts).where(eq(payouts.txHash, txHash)).limit(1);
    return row;
  },

  async findScheduledForPeriod(allowanceId: string, period: string): Promise<Payout | undefined> {
    const [row] = await db
      .select()
      .from(payouts)
      .where(
        and(
          eq(payouts.allowanceId, allowanceId),
          eq(payouts.period, period),
          eq(payouts.status, 'scheduled'),
        ),
      )
      .limit(1);
    return row;
  },

  async update(
    id: string,
    patch: Partial<Pick<Payout, 'status' | 'txHash' | 'pickupRef' | 'memo'>>,
  ): Promise<Payout> {
    const [row] = await db
      .update(payouts)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(payouts.id, id))
      .returning();
    return row;
  },

  async setStatus(id: string, status: PayoutStatus): Promise<Payout> {
    return payoutRepo.update(id, { status });
  },
};
