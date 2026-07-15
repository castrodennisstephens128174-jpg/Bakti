import { inArray, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { allowances, payouts, sessions } from '@/server/db/schema';

const DELIVERED: Array<'sent' | 'settled' | 'collected'> = ['sent', 'settled', 'collected'];

export type StatsCounts = {
  uniqueWallets: number;
  logins: number;
  totalAllowances: number;
  activeAllowances: number;
  payoutsDelivered: number;
  parentsCollected: number;
};

export const statsRepo = {
  async counts(): Promise<StatsCounts> {
    const [walletRow] = await db
      .select({
        uniqueWallets: sql<number>`count(distinct ${sessions.publicKey})`,
        logins: sql<number>`count(*)`,
      })
      .from(sessions);

    const [allowanceRow] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${allowances.status} = 'active')`,
      })
      .from(allowances);

    const [deliveredRow] = await db
      .select({ delivered: sql<number>`count(*)` })
      .from(payouts)
      .where(inArray(payouts.status, DELIVERED));

    const [collectedRow] = await db
      .select({ collected: sql<number>`count(*)` })
      .from(payouts)
      .where(inArray(payouts.status, ['collected']));

    return {
      uniqueWallets: Number(walletRow?.uniqueWallets) || 0,
      logins: Number(walletRow?.logins) || 0,
      totalAllowances: Number(allowanceRow?.total) || 0,
      activeAllowances: Number(allowanceRow?.active) || 0,
      payoutsDelivered: Number(deliveredRow?.delivered) || 0,
      parentsCollected: Number(collectedRow?.collected) || 0,
    };
  },
};
