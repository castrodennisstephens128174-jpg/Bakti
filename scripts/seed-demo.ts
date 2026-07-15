/**
 * Seed Bakti with a realistic Southeast-Asian persona.
 *
 * Persona: Dewi Lestari — an Indonesian caregiver working in Singapore who
 * sends a steady monthly allowance home to her parents in Malang, East Java.
 *
 * The demo sender is the shared testnet wallet (also what Freighter signs with),
 * so connecting that wallet shows this data. One allowance receives a REAL
 * on-chain testnet payment so the detail view shows a genuine settled payout
 * with a clickable stellar.expert link — no fabricated success states.
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
import { makePickupRef } from '@/server/service/payout.service';

const HORIZON = process.env.STELLAR_HORIZON_URL ?? 'https://horizon.stellar.org';
const PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE ?? Networks.TESTNET;

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
  console.log('Seeding Bakti demo data for', SENDER_PUBLIC);

  await sessionRepo.insert({
    publicKey: SENDER_PUBLIC,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
  });

  const bambang = Keypair.random();
  const sriwahyuni = Keypair.random();
  const budi = Keypair.random();
  await Promise.all([friendbot(bambang.publicKey()), friendbot(sriwahyuni.publicKey())]).catch(
    () => {},
  );

  const plans = [
    {
      recipientName: 'Bapak Bambang (Ayah)',
      recipientAddress: bambang.publicKey(),
      corridor: 'Indonesia · Hana pickup',
      asset: 'XLM' as const,
      monthlyAmount: '4',
      dayOfMonth: 5,
      note: 'For Ayah — medicine and market money',
      real: true,
    },
    {
      recipientName: 'Ibu Sri Wahyuni (Ibu)',
      recipientAddress: sriwahyuni.publicKey(),
      corridor: 'Indonesia · Hana pickup',
      asset: 'XLM' as const,
      monthlyAmount: '3',
      dayOfMonth: 5,
      note: 'For Ibu — groceries',
      real: false,
    },
    {
      recipientName: 'Om Budi (Uncle)',
      recipientAddress: budi.publicKey(),
      corridor: 'Indonesia · MoneyGram',
      asset: 'USDC' as const,
      monthlyAmount: '10',
      dayOfMonth: 12,
      note: 'Helping with the family shop',
      real: false,
    },
  ];

  for (const plan of plans) {
    const allowance = await allowanceRepo.insert({
      publicKey: SENDER_PUBLIC,
      recipientName: plan.recipientName,
      recipientAddress: plan.recipientAddress,
      corridor: plan.corridor,
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
          status: 'collected',
          txHash,
          pickupRef: makePickupRef(plan.corridor, period(-1)),
          memo: `Bakti allowance ${period(-1)}`,
          network: 'testnet',
        });
        console.log('  real payment recorded (collected):', txHash);
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
    console.log('  allowance created:', plan.recipientName);
  }

  console.log('Seed complete.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
