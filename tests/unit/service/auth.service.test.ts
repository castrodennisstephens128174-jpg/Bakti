// @vitest-environment node
import { Keypair, Networks, TransactionBuilder } from '@stellar/stellar-sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db/repos/auth.repo', () => ({
  authNonceRepo: {
    insert: vi.fn(),
    findActive: vi.fn(),
    consume: vi.fn(),
  },
  sessionRepo: {
    insert: vi.fn(),
    findById: vi.fn(),
    delete: vi.fn(),
  },
}));

import { authNonceRepo, sessionRepo } from '@/server/db/repos/auth.repo';
import { authService } from '@/server/service/auth.service';

const PASSPHRASE = Networks.TESTNET;

function sign(xdr: string, kp: Keypair): string {
  const tx = TransactionBuilder.fromXDR(xdr, PASSPHRASE);
  tx.sign(kp);
  return tx.toXDR();
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService.createChallenge', () => {
  it('rejects an invalid public key', async () => {
    await expect(authService.createChallenge('not-a-key')).rejects.toThrow(/invalid/i);
    expect(authNonceRepo.insert).not.toHaveBeenCalled();
  });

  it('builds a manageData challenge and stores the nonce', async () => {
    const kp = Keypair.random();
    const res = await authService.createChallenge(kp.publicKey());
    expect(res.txXdr).toBeTruthy();
    expect(res.nonce.length).toBeGreaterThan(10);
    expect(authNonceRepo.insert).toHaveBeenCalledOnce();
  });
});

describe('authService.verifyAndCreateSession', () => {
  it('rejects an invalid public key', async () => {
    await expect(authService.verifyAndCreateSession('bad', 'xdr')).rejects.toThrow(/invalid/i);
  });

  it('rejects malformed transaction XDR', async () => {
    const kp = Keypair.random();
    await expect(authService.verifyAndCreateSession(kp.publicKey(), 'not-xdr')).rejects.toThrow(
      /invalid transaction xdr/i,
    );
  });

  it('rejects a signature from the wrong key', async () => {
    const owner = Keypair.random();
    const attacker = Keypair.random();
    const { txXdr } = await authService.createChallenge(owner.publicKey());
    const signed = sign(txXdr, attacker);
    await expect(authService.verifyAndCreateSession(owner.publicKey(), signed)).rejects.toThrow(
      /signature does not match/i,
    );
  });

  it('rejects when the nonce is not active', async () => {
    const kp = Keypair.random();
    const { txXdr } = await authService.createChallenge(kp.publicKey());
    const signed = sign(txXdr, kp);
    vi.mocked(authNonceRepo.findActive).mockResolvedValue(undefined);
    await expect(authService.verifyAndCreateSession(kp.publicKey(), signed)).rejects.toThrow(
      /not found or expired/i,
    );
  });

  it('verifies a valid signature, consumes the nonce, and mints a session', async () => {
    const kp = Keypair.random();
    const { txXdr, nonce } = await authService.createChallenge(kp.publicKey());
    const signed = sign(txXdr, kp);
    vi.mocked(authNonceRepo.findActive).mockResolvedValue({
      nonce,
      publicKey: kp.publicKey(),
      expiresAt: new Date(Date.now() + 10_000),
      consumedAt: null,
    });
    vi.mocked(sessionRepo.insert).mockResolvedValue('session-123');

    const res = await authService.verifyAndCreateSession(kp.publicKey(), signed);
    expect(authNonceRepo.consume).toHaveBeenCalledWith(nonce);
    expect(res.sessionId).toBe('session-123');
  });
});

describe('authService.mintSession / destroySession', () => {
  it('mints a session for a public key', async () => {
    vi.mocked(sessionRepo.insert).mockResolvedValue('s1');
    const res = await authService.mintSession('GABC');
    expect(res.sessionId).toBe('s1');
  });

  it('destroys a session by id', async () => {
    await authService.destroySession('s1');
    expect(sessionRepo.delete).toHaveBeenCalledWith('s1');
  });
});
