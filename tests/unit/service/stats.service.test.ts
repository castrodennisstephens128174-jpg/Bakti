import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db/repos/stats.repo', () => ({
  statsRepo: { counts: vi.fn() },
}));

import { statsRepo } from '@/server/db/repos/stats.repo';
import { statsService } from '@/server/service/stats.service';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('statsService.global', () => {
  it('maps the repo counts to the public stats envelope', async () => {
    vi.mocked(statsRepo.counts).mockResolvedValue({
      uniqueWallets: 3,
      logins: 9,
      totalAllowances: 5,
      activeAllowances: 4,
      payoutsDelivered: 7,
      parentsCollected: 2,
    });

    const stats = await statsService.global();
    expect(stats).toEqual({
      uniqueWallets: 3,
      logins: 9,
      totalAllowances: 5,
      activeAllowances: 4,
      payoutsDelivered: 7,
      parentsCollected: 2,
    });
  });
});
