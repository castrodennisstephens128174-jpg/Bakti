// @vitest-environment node
import { Keypair, TransactionBuilder } from '@stellar/stellar-sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db/repos/anchor.repo', () => ({
  anchorCustomerRepo: {
    insert: vi.fn(),
    findById: vi.fn(),
  },
  anchorTransactionRepo: {
    insert: vi.fn(),
    findById: vi.fn(),
  },
}));

import { env, STELLAR_NETWORK_PASSPHRASE_VALUE } from '@/server/config/env';
import { anchorCustomerRepo, anchorTransactionRepo } from '@/server/db/repos/anchor.repo';
import { issueToken } from '@/server/lib/anchor-token';
import { anchorServerService } from '@/server/service/anchor-server.service';

const HOME_DOMAIN = 'bakti-testnet.vercel.app';
const SERVER_SEED = Keypair.random().secret();

function sign(xdr: string, kp: Keypair): string {
  const tx = TransactionBuilder.fromXDR(xdr, STELLAR_NETWORK_PASSPHRASE_VALUE);
  tx.sign(kp);
  return tx.toEnvelope().toXDR('base64');
}

beforeEach(() => {
  vi.clearAllMocks();
  // biome-ignore lint/suspicious/noExplicitAny: test-only env override
  (env as any).ANCHOR_STUB_SERVER_SIGNING_SEED = SERVER_SEED;
});

describe('anchorServerService.stellarToml', () => {
  it('renders the signing key, endpoints, and USDC currency', () => {
    const toml = anchorServerService.stellarToml(HOME_DOMAIN);
    expect(toml).toContain('SIGNING_KEY');
    expect(toml).toContain(`https://${HOME_DOMAIN}/api/anchor/auth`);
    expect(toml).toContain(`https://${HOME_DOMAIN}/api/anchor/sep31`);
    expect(toml).toContain('code = "USDC"');
  });
});

describe('anchorServerService SEP-10 challenge/verify', () => {
  it('builds a challenge and verifies a client signature into a bearer token', () => {
    const client = Keypair.random();
    const challenge = anchorServerService.createChallenge(client.publicKey(), HOME_DOMAIN);
    const signed = sign(challenge, client);

    const token = anchorServerService.verifyChallenge(signed, HOME_DOMAIN);
    expect(token).toBeTruthy();
    expect(token.split('.')).toHaveLength(2);
  });

  it('rejects a challenge signed by the wrong key', () => {
    const client = Keypair.random();
    const attacker = Keypair.random();
    const challenge = anchorServerService.createChallenge(client.publicKey(), HOME_DOMAIN);
    const signed = sign(challenge, attacker);

    expect(() => anchorServerService.verifyChallenge(signed, HOME_DOMAIN)).toThrow(/signature/i);
  });
});

describe('anchorServerService.putCustomer', () => {
  it('rejects without a bearer token', async () => {
    await expect(
      anchorServerService.putCustomer(undefined, {
        first_name: 'A',
        last_name: 'B',
        email_address: 'a@b.com',
      }),
    ).rejects.toThrow(/bearer token/i);
  });

  it('rejects missing required fields', async () => {
    const token = issueToken('GABC', 300);
    await expect(anchorServerService.putCustomer(token, { first_name: 'A' })).rejects.toThrow(
      /missing required/i,
    );
  });

  it('stores fields and returns an id', async () => {
    const token = issueToken('GABC', 300);
    vi.mocked(anchorCustomerRepo.insert).mockResolvedValue('cust-1');
    const res = await anchorServerService.putCustomer(token, {
      first_name: 'A',
      last_name: 'B',
      email_address: 'a@b.com',
    });
    expect(res.id).toBe('cust-1');
    expect(anchorCustomerRepo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'sep31-receiver' }),
    );
  });
});

describe('anchorServerService.createTransaction', () => {
  const token = issueToken('GABC', 300);

  it('rejects an unsupported asset', async () => {
    await expect(
      anchorServerService.createTransaction(token, {
        amount: '10',
        assetCode: 'SRT',
        receiverId: 'cust-1',
        fundingMethod: 'bank_account',
      }),
    ).rejects.toThrow(/unsupported asset/i);
  });

  it('rejects an unsupported funding method', async () => {
    await expect(
      anchorServerService.createTransaction(token, {
        amount: '10',
        assetCode: 'USDC',
        receiverId: 'cust-1',
        fundingMethod: 'CASH',
      }),
    ).rejects.toThrow(/unsupported funding_method/i);
  });

  it('rejects an unknown receiver', async () => {
    vi.mocked(anchorCustomerRepo.findById).mockResolvedValue(undefined);
    await expect(
      anchorServerService.createTransaction(token, {
        amount: '10',
        assetCode: 'USDC',
        receiverId: 'missing',
        fundingMethod: 'bank_account',
      }),
    ).rejects.toThrow(/unknown receiver_id/i);
  });

  it('creates a pending_sender transaction for a known receiver', async () => {
    vi.mocked(anchorCustomerRepo.findById).mockResolvedValue({
      id: 'cust-1',
      type: 'sep31-receiver',
      fields: {},
      createdAt: new Date(),
    });
    vi.mocked(anchorTransactionRepo.insert).mockResolvedValue('tx-1');

    const res = await anchorServerService.createTransaction(token, {
      amount: '10',
      assetCode: 'USDC',
      receiverId: 'cust-1',
      fundingMethod: 'bank_account',
    });
    expect(res).toEqual({ id: 'tx-1', status: 'pending_sender' });
  });
});

describe('anchorServerService.getTransaction', () => {
  const token = issueToken('GABC', 300);

  it('rejects an unknown transaction', async () => {
    vi.mocked(anchorTransactionRepo.findById).mockResolvedValue(undefined);
    await expect(anchorServerService.getTransaction(token, 'missing')).rejects.toThrow(
      /not found/i,
    );
  });

  it('returns the wire-shaped transaction status', async () => {
    vi.mocked(anchorTransactionRepo.findById).mockResolvedValue({
      id: 'tx-1',
      status: 'pending_sender',
      amountIn: '10',
      assetCode: 'USDC',
      receiverId: 'cust-1',
      fundingMethod: 'bank_account',
      stellarAccountId: 'GSTUB',
      stellarMemo: '12345',
      stellarMemoType: 'id',
      createdAt: new Date(),
    });
    const res = await anchorServerService.getTransaction(token, 'tx-1');
    expect(res).toEqual({
      id: 'tx-1',
      status: 'pending_sender',
      amount_in: '10',
      stellar_account_id: 'GSTUB',
      stellar_memo: '12345',
      stellar_memo_type: 'id',
    });
  });
});
