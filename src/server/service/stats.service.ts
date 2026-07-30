import { statsRepo } from '@/server/db/repos/stats.repo';

export const statsService = {
  /** Public, real interaction counts drawn from sessions + core entities. */
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
