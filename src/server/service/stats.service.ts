import { statsRepo } from '@/server/db/repos/stats.repo';

export const statsService = {
  /** Public app-database counts; not provider reports or market traction. */
  async global() {
    const c = await statsRepo.counts();
    return {
      uniqueWallets: c.uniqueWallets,
      logins: c.logins,
      totalAllowances: c.totalAllowances,
      activeAllowances: c.activeAllowances,
      payoutsDelivered: c.payoutsDelivered,
      parentsCollected: c.parentsCollected,
    };
  },
};
