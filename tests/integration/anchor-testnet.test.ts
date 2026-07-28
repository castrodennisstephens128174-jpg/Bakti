// Real testnet network calls against a local Anchor Platform stand-in.
// Requires: `docker compose -f anchor-platform/docker-compose.yaml up -d`
// (from anchor-platform/, or with `--project-directory anchor-platform`), then
// `pnpm test:anchor`. See anchor-platform/README.md for what's running and why.
import { Keypair, Networks } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';
import type { PaymentStatus } from '@/server/stellar/anchor';
import {
  authenticate,
  fetchAnchorToml,
  getPaymentStatus,
  sendViaAnchor,
} from '@/server/stellar/anchor';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * This reference anchor reviews a transaction asynchronously (via its Kafka
 * event pipeline) before it moves from `pending_receiver` to `pending_sender`
 * and gets its Stellar payment account/memo populated. Poll instead of
 * asserting on the immediate post-creation status.
 */
async function pollForSenderReady(
  homeDomain: string,
  jwt: string,
  transactionId: string,
): Promise<PaymentStatus> {
  const toml = await fetchAnchorToml(homeDomain);
  for (let attempt = 0; attempt < 10; attempt++) {
    const status = await getPaymentStatus(toml, jwt, transactionId);
    if (status.status === 'pending_sender' && status.stellarAccountId) return status;
    await sleep(1000);
  }
  throw new Error(`Transaction ${transactionId} never reached pending_sender in time`);
}

const ANCHOR_HOME_DOMAIN = process.env.ANCHOR_HOME_DOMAIN ?? 'localhost:8180';

// Testnet-only, funded via friendbot for this test. Holds no real value —
// see anchor-platform/README.md for how it (and the anchor's own accounts)
// were generated.
const SENDER_SECRET =
  process.env.SECRET_ANCHOR_SIGNING_SEED ??
  'SCLWCKRYWFDH3VDFL2XNC5BTRJ2PFKU3QDWV3GQ2O4ROCQJTRJBP5HMW';

const RECEIVER_KYC = {
  first_name: 'Maria',
  last_name: 'Santos',
  email_address: 'maria@example.com',
  bank_account_number: '1234567890',
  bank_account_type: 'checking',
  bank_number: '021000021',
  clabe_number: '002010077777777771',
};

describe('SEP-31 testnet integration', () => {
  it('registers a real payment intent with a running Anchor Platform instance', async () => {
    const senderKeypair = Keypair.fromSecret(SENDER_SECRET);

    const result = await sendViaAnchor({
      homeDomain: ANCHOR_HOME_DOMAIN,
      networkPassphrase: Networks.TESTNET,
      senderKeypair,
      amount: '50',
      assetCode: 'USDC',
      fundingMethod: 'CASH',
      receiverKyc: RECEIVER_KYC,
    });

    expect(result.transactionId).toBeTruthy();
    expect(result.status.id).toBe(result.transactionId);
    expect(result.status.amountIn).toBe('50');
    expect(result.status.status).toMatch(/^pending_/);

    const toml = await fetchAnchorToml(ANCHOR_HOME_DOMAIN);
    const jwt = await authenticate(toml, senderKeypair, {
      networkPassphrase: Networks.TESTNET,
      homeDomain: ANCHOR_HOME_DOMAIN,
    });
    const readyStatus = await pollForSenderReady(ANCHOR_HOME_DOMAIN, jwt, result.transactionId);

    expect(readyStatus.status).toBe('pending_sender');
    expect(readyStatus.stellarAccountId).toMatch(/^G[A-Z0-9]{55}$/);
    expect(readyStatus.stellarMemo).toBeTruthy();
  });
});
