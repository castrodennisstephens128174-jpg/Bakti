// Real network calls from Bakti's own SEP-31 client to Bakti's own self-hosted
// SEP-1/10/12/31 anchor stub (src/server/service/anchor-server.service.ts),
// served by this same Next.js app. Proves the round trip works end to end on
// a single deploy — no external anchor, no local docker — which is what a
// testnet Vercel deploy relies on.
// Requires: `pnpm dev` running with ANCHOR_STUB_SERVER_SIGNING_SEED set and
// DRIZZLE_DATABASE_URL pointed at a reachable Postgres with the schema pushed,
// then `pnpm test:anchor`.
import { Keypair } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';
import { sendViaAnchor } from '@/server/stellar/anchor';

const ANCHOR_HOME_DOMAIN = process.env.SELFHOST_ANCHOR_HOME_DOMAIN ?? 'localhost:3005';

describe('SEP-31 self-hosted anchor stub loopback', () => {
  it('registers a real payment intent with this app acting as its own anchor', async () => {
    const senderKeypair = Keypair.random();

    const result = await sendViaAnchor({
      homeDomain: ANCHOR_HOME_DOMAIN,
      networkPassphrase: 'Test SDF Network ; September 2015',
      senderKeypair,
      amount: '10',
      assetCode: 'USDC',
      fundingMethod: 'bank_account',
      receiverKyc: {
        first_name: 'Test',
        last_name: 'Receiver',
        email_address: 'test-receiver@example.com',
      },
    });

    expect(result.transactionId).toBeTruthy();
    expect(result.status.id).toBe(result.transactionId);
    expect(result.status.status).toBe('pending_sender');
    expect(result.status.amountIn).toBe('10');
    expect(result.status.stellarAccountId).toMatch(/^G[A-Z0-9]{55}$/);
    expect(result.status.stellarMemo).toBeTruthy();
  });
});
