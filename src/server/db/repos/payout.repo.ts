import { and, desc, eq, isNull, lt, or, sql } from 'drizzle-orm';
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

  /**
   * Atomically claim a scheduled payout for release. Returns the payout only
   * if THIS caller won the claim; a stale claim (crashed keeper) can be
   * re-claimed after 15 minutes. This is the double-release safety latch.
   */
  async claimForRelease(id: string): Promise<Payout | undefined> {
    const [row] = await db
      .update(payouts)
      .set({ claimedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(payouts.id, id),
          eq(payouts.status, 'scheduled'),
          or(isNull(payouts.claimedAt), lt(payouts.claimedAt, sql`now() - interval '15 minutes'`)),
        ),
      )
      .returning();
    return row;
  },

  async countSettled(allowanceId: string): Promise<number> {
    const [row] = await db
      .select({ n: sql<number>`count(*)` })
      .from(payouts)
      .where(and(eq(payouts.allowanceId, allowanceId), eq(payouts.status, 'settled')));
    return Number(row?.n ?? 0);
  },

  async findBySep31Id(sep31Id: string): Promise<Payout | undefined> {
    const [row] = await db.select().from(payouts).where(eq(payouts.sep31Id, sep31Id)).limit(1);
    return row;
  },

  /** Any payout row for this allowance+period, newest first, regardless of status. */
  async findAnyForPeriod(allowanceId: string, period: string): Promise<Payout | undefined> {
    const [row] = await db
      .select()
      .from(payouts)
      .where(and(eq(payouts.allowanceId, allowanceId), eq(payouts.period, period)))
      .orderBy(desc(payouts.createdAt))
      .limit(1);
    return row;
  },

  async findSep31ForPeriod(allowanceId: string, period: string): Promise<Payout | undefined> {
    const [row] = await db
      .select()
      .from(payouts)
      .where(and(eq(payouts.allowanceId, allowanceId), eq(payouts.period, period)))
      .orderBy(desc(payouts.createdAt))
      .limit(1);
    return row?.sep31Id ? row : undefined;
  },

  async update(
    id: string,
    patch: Partial<
      Pick<
        Payout,
        | 'status'
        | 'txHash'
        | 'pickupRef'
        | 'memo'
        | 'sep31Id'
        | 'sep31Status'
        | 'anchorDomain'
        | 'anchorAccount'
        | 'anchorMemo'
        | 'anchorMemoType'
        | 'claimedAt'
      >
    >,
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
