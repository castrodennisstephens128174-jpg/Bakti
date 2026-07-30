import { StrKey } from '@stellar/stellar-sdk';
import { allowanceRepo } from '@/server/db/repos/allowance.repo';
import { payoutRepo } from '@/server/db/repos/payout.repo';
import type { Allowance, AllowanceAsset, AllowanceStatus, Payout } from '@/server/db/schema';
import { ALLOWANCE_ASSETS } from '@/server/db/schema/allowances';
import { toStroops } from '@/server/lib/amount';
import { AppError } from '@/server/lib/http';
import { fetchAnchorEndpoints, sep31Enabled } from '@/server/anchor/sep31';
import { activeNetwork, buildCreateScheduleXdr, submitCreateSchedule } from '@/server/stellar';
import { currentPeriod } from './payout.service';
import { prepareKyc, sealKyc } from './sep31kyc.service';

export type AllowanceAction = 'pause' | 'resume' | 'end';

export const DEFAULT_MONTHS = 3;

export type AllowanceInput = {
  recipientName: string;
  recipientAddress: string;
  corridor: string;
  asset: AllowanceAsset;
  monthlyAmount: string;
  dayOfMonth: number;
  months?: number;
  note?: string;
  kyc?: {
    senderFirstName: string;
    senderLastName: string;
    senderIdType?: string;
    senderIdNumber?: string;
    receiverFirstName: string;
    receiverLastName: string;
    receiverIdType?: string;
    receiverIdNumber?: string;
    senderCustomerId?: string;
    receiverCustomerId?: string;
  };
};

const ALLOWANCE_TRANSITIONS: Record<
  AllowanceAction,
  Partial<Record<AllowanceStatus, AllowanceStatus>>
> = {
  pause: { active: 'paused' },
  resume: { paused: 'active' },
  end: { active: 'ended', paused: 'ended' },
};

/**
 * Allowance lifecycle guard. Returns the next status for a valid action, or
 * throws CONFLICT for any invalid transition (e.g. resuming an active plan,
 * touching an ended one). This is the single source of truth for the machine.
 */
export function nextAllowanceStatus(
  current: AllowanceStatus,
  action: AllowanceAction,
): AllowanceStatus {
  const next = ALLOWANCE_TRANSITIONS[action]?.[current];
  if (!next) {
    throw new AppError('CONFLICT', `Cannot ${action} an allowance that is ${current}`, 409);
  }
  return next;
}

export function assertAllowanceInput(input: AllowanceInput): void {
  if (!input.recipientName.trim()) {
    throw new AppError('INVALID_INPUT', 'Add the name of the parent you support', 400);
  }
  // SEP-31: the parent collects cash from the anchor and never holds a wallet,
  // so no Stellar address is needed (or stored) on that corridor.
  if (input.corridor !== 'sep31' && !StrKey.isValidEd25519PublicKey(input.recipientAddress)) {
    throw new AppError('INVALID_INPUT', 'The recipient Stellar address is invalid', 400);
  }
  if (input.corridor === 'sep31' && input.recipientAddress) {
    input.recipientAddress = '';
  }
  if (!input.corridor.trim()) {
    throw new AppError('INVALID_INPUT', 'Choose a cash-pickup corridor', 400);
  }
  if (!ALLOWANCE_ASSETS.includes(input.asset)) {
    throw new AppError('INVALID_INPUT', 'Asset must be XLM or USDC', 400);
  }
  if (toStroops(input.monthlyAmount) <= 0n) {
    throw new AppError('INVALID_INPUT', 'Set a monthly amount greater than zero', 400);
  }
  if (!Number.isInteger(input.dayOfMonth) || input.dayOfMonth < 1 || input.dayOfMonth > 28) {
    throw new AppError('INVALID_INPUT', 'Payout day must be between 1 and 28', 400);
  }
  if (
    input.months !== undefined &&
    (!Number.isInteger(input.months) || input.months < 1 || input.months > 12)
  ) {
    throw new AppError('INVALID_INPUT', 'Months to pre-fund must be between 1 and 12', 400);
  }
  if (input.corridor === 'sep31') {
    const k = input.kyc;
    if (
      !k?.senderFirstName?.trim() ||
      !k?.senderLastName?.trim() ||
      !k?.receiverFirstName?.trim() ||
      !k?.receiverLastName?.trim()
    ) {
      throw new AppError(
        'INVALID_INPUT',
        'The anchor corridor needs sender and receiver full names (KYC)',
        400,
      );
    }
    const senderOk = k.senderIdNumber?.trim() || k.senderCustomerId;
    const receiverOk = k.receiverIdNumber?.trim() || k.receiverCustomerId;
    if (!senderOk || !receiverOk) {
      throw new AppError(
        'INVALID_INPUT',
        'The anchor corridor needs a government ID for both sender and receiver',
        400,
      );
    }
  }
}

export type AllowanceWithPayouts = Allowance & { payouts: Payout[] };
export type AllowanceSummary = Allowance & { payoutCount: number; lastPayout: Payout | null };

type EscrowRef = { scheduleId: string; contractId: string; escrowTxHash: string };

async function insertAllowanceWithFirstPayout(
  publicKey: string,
  input: AllowanceInput,
  networkId: string,
  escrow?: EscrowRef,
): Promise<AllowanceWithPayouts> {
  const allowance = await allowanceRepo.insert({
    publicKey,
    recipientName: input.recipientName.trim(),
    recipientAddress: input.recipientAddress,
    corridor: input.corridor.trim(),
    asset: input.asset,
    monthlyAmount: input.monthlyAmount,
    dayOfMonth: input.dayOfMonth,
    months: input.months ?? DEFAULT_MONTHS,
    scheduleId: escrow?.scheduleId ?? null,
    contractId: escrow?.contractId ?? null,
    escrowTxHash: escrow?.escrowTxHash ?? null,
    note: input.note?.trim() || null,
    kycJson: input.kyc ? sealKyc(input.kyc) : null,
    network: networkId,
  });
  await payoutRepo.insert({
    allowanceId: allowance.id,
    publicKey,
    asset: allowance.asset,
    amount: allowance.monthlyAmount,
    period: currentPeriod(),
    status: 'scheduled',
    memo: `Bakti allowance ${currentPeriod()}`,
    network: networkId,
  });
  return allowanceService.getOwned(allowance.id, publicKey);
}

export const allowanceService = {
  /** Classic path (USDC, or when no on-chain escrow is signed): a plan-only insert. */
  async create(publicKey: string, input: AllowanceInput): Promise<AllowanceWithPayouts> {
    assertAllowanceInput(input);
    const net = await activeNetwork();
    if (input.corridor === 'sep31' && input.kyc && sep31Enabled()) {
      // Register KYC with the anchor up front — approval before any money moves.
      input.kyc = await prepareKyc(publicKey, input.kyc);
    }
    return insertAllowanceWithFirstPayout(publicKey, input, net.id);
  },

  /**
   * Build the UNSIGNED `create_schedule` invoke that escrows the whole run
   * (monthly_amount * months) from the sender into the Bakti contract. XLM only.
   */
  async buildEscrow(
    publicKey: string,
    input: AllowanceInput,
  ): Promise<{ xdr: string; contractId: string; months: number; kyc?: AllowanceInput['kyc'] }> {
    assertAllowanceInput(input);
    if (input.asset !== 'XLM') {
      throw new AppError('INVALID_INPUT', 'The escrow contract holds XLM; use XLM for on-chain.', 400);
    }
    const months = input.months ?? DEFAULT_MONTHS;
    const net = await activeNetwork();

    let recipient = input.recipientAddress;
    let preparedKyc: AllowanceInput['kyc'];
    if (input.corridor === 'sep31') {
      // SEP-31 escrow settles into the anchor's receiving account (SEP-1
      // ACCOUNTS), and the anchor must ACCEPT both customers BEFORE the sender
      // locks months of money into the contract.
      if (!sep31Enabled()) {
        throw new AppError('CONFLICT', 'SEP-31 anchor integration is not configured', 409);
      }
      const endpoints = await fetchAnchorEndpoints();
      if (!endpoints.accounts[0]) {
        throw new AppError('INTERNAL', 'Anchor does not publish a receiving account', 502);
      }
      recipient = endpoints.accounts[0];
      if (input.kyc) {
        preparedKyc = await prepareKyc(publicKey, input.kyc);
      }
    }

    const { xdr } = await buildCreateScheduleXdr(
      {
        sender: publicKey,
        recipient,
        monthlyAmount: input.monthlyAmount,
        months,
      },
      net,
    );
    return { xdr, contractId: net.contractId, months, kyc: preparedKyc };
  },

  /**
   * Submit the sender-signed escrow, then persist the allowance backed by the
   * on-chain schedule id. Each monthly send releases one period from this escrow.
   */
  async createEscrowed(
    publicKey: string,
    input: AllowanceInput,
    signedXdr: string,
  ): Promise<AllowanceWithPayouts> {
    assertAllowanceInput(input);
    if (input.asset !== 'XLM') {
      throw new AppError('INVALID_INPUT', 'The escrow contract holds XLM; use XLM for on-chain.', 400);
    }
    if (input.corridor === 'sep31' && input.kyc && !input.kyc.senderCustomerId && sep31Enabled()) {
      input.kyc = await prepareKyc(publicKey, input.kyc);
    }
    const net = await activeNetwork();
    const { hash, scheduleId } = await submitCreateSchedule(signedXdr, net);
    return insertAllowanceWithFirstPayout(publicKey, input, net.id, {
      scheduleId,
      contractId: net.contractId,
      escrowTxHash: hash,
    });
  },

  async list(publicKey: string): Promise<AllowanceSummary[]> {
    const net = await activeNetwork();
    const rows = await allowanceRepo.listByOwner(publicKey, net.id);
    const out: AllowanceSummary[] = [];
    for (const a of rows) {
      const payouts = await payoutRepo.listByAllowance(a.id);
      out.push({ ...a, payoutCount: payouts.length, lastPayout: payouts[0] ?? null });
    }
    return out;
  },

  async getOwned(id: string, publicKey: string): Promise<AllowanceWithPayouts> {
    const allowance = await allowanceRepo.findOwned(id, publicKey);
    if (!allowance) throw new AppError('NOT_FOUND', 'Allowance not found', 404);
    const payouts = await payoutRepo.listByAllowance(id);
    return { ...allowance, payouts };
  },

  async changeStatus(
    id: string,
    publicKey: string,
    action: AllowanceAction,
  ): Promise<AllowanceWithPayouts> {
    const allowance = await allowanceRepo.findOwned(id, publicKey);
    if (!allowance) throw new AppError('NOT_FOUND', 'Allowance not found', 404);
    const next = nextAllowanceStatus(allowance.status, action);
    await allowanceRepo.setStatus(id, next);
    return allowanceService.getOwned(id, publicKey);
  },
};
