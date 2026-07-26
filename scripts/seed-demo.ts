/**
 * Seed Bakti with a Malaysia → Philippines research-corridor persona.
 *
 * The optional real payment is a Stellar testnet XLM transfer to a generated
 * recipient account. It is recorded only as `sent`; no provider settlement or
 * cash collection is created.
 */
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { allowanceRepo } from '@/server/db/repos/allowance.repo';
import { sessionRepo } from '@/server/db/repos/auth.repo';
import { payoutRepo } from '@/server/db/repos/payout.repo';

const HORIZON = process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';
const PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE ?? Networks.TESTNET;
const RESEARCH_CORRIDOR = 'Malaysia → Philippines · research corridor';

const SENDER_PUBLIC =
  process.env.DEMO_SENDER_PUBLIC ?? 'GBL5RJKF4QNJ4ZPLJZ7PS7K5A4J44VEZJRV2CRTFFDRVSY2N76AIIE47';
const SENDER_SECRET = process.env.DEMO_SENDER_SECRET ?? '';

function period(offsetMonths = 0): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + offsetMonths);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function friendbot(pubkey: string): Promise<void> {
  const res = await fetch(`https://friendbot.stellar.org/?addr=${pubkey}`);
  if (!res.ok && res.status !== 400) throw new Error(`friendbot ${res.status}`);
}

async function sendRealPayment(to: string, amount: string, memo: string): Promise<string> {
  const kp = Keypair.fromSecret(SENDER_SECRET);
  const server = new Horizon.Server(HORIZON);
  const account = await server.loadAccount(kp.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: (Number(BASE_FEE) * 10).toString(),
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(Operation.payment({ destination: to, asset: Asset.native(), amount }))
    .addMemo(Memo.text(memo.slice(0, 28)))
    .setTimeout(120)
    .build();
  tx.sign(kp);
  const res = await server.submitTransaction(tx);
  return res.hash;
}

async function main() {
  console.log('Seeding Bakti testnet demo data for', SENDER_PUBLIC);

  await sessionRepo.insert({
    publicKey: SENDER_PUBLIC,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
  });

  const rosa = Keypair.random();
  const miguel = Keypair.random();
  const ana = Keypair.random();
  await Promise.all([friendbot(rosa.publicKey()), friendbot(miguel.publicKey())]).catch(() => {});

  const plans = [
    {
      recipientName: 'Nanay Rosa',
      recipientAddress: rosa.publicKey(),
      asset: 'XLM' as const,
      monthlyAmount: '4',
      dayOfMonth: 25,
      note: 'Salary-day support planning demo',
      real: true,
    },
    {
      recipientName: 'Tatay Miguel',
      recipientAddress: miguel.publicKey(),
      asset: 'XLM' as const,
      monthlyAmount: '3',
      dayOfMonth: 25,
      note: 'Groceries support planning demo',
      real: false,
    },
    {
      recipientName: 'Ate Ana',
      recipientAddress: ana.publicKey(),
      asset: 'USDC' as const,
      monthlyAmount: '10',
      dayOfMonth: 12,
      note: 'Direct USDC transfer planning demo',
      real: false,
    },
  ];

  for (const plan of plans) {
    const allowance = await allowanceRepo.insert({
      publicKey: SENDER_PUBLIC,
      recipientName: plan.recipientName,
      recipientAddress: plan.recipientAddress,
      corridor: RESEARCH_CORRIDOR,
      asset: plan.asset,
      monthlyAmount: plan.monthlyAmount,
      dayOfMonth: plan.dayOfMonth,
      note: plan.note,
      network: 'testnet',
    });

    if (plan.real && SENDER_SECRET) {
      try {
        const txHash = await sendRealPayment(
          plan.recipientAddress,
          plan.monthlyAmount,
          `Bakti ${plan.recipientName}`,
        );
        await payoutRepo.insert({
          allowanceId: allowance.id,
          publicKey: SENDER_PUBLIC,
          asset: plan.asset,
          amount: plan.monthlyAmount,
          period: period(-1),
          status: 'sent',
          txHash,
          pickupRef: null,
          memo: `Bakti allowance ${period(-1)}`,
          network: 'testnet',
        });
        console.log('  verified testnet payment recorded:', txHash);
      } catch (e) {
        console.warn('  real payment skipped:', (e as Error).message);
      }
    }

    await payoutRepo.insert({
      allowanceId: allowance.id,
      publicKey: SENDER_PUBLIC,
      asset: plan.asset,
      amount: plan.monthlyAmount,
      period: period(0),
      status: 'scheduled',
      memo: `Bakti allowance ${period(0)}`,
      network: 'testnet',
    });
    console.log('  support plan created:', plan.recipientName);
  }

  console.log('Seed complete.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
