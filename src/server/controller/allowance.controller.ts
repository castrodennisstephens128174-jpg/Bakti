import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { env } from '@/server/config/env';
import { AppError, created, ok } from '@/server/lib/http';
import type { HandlerContext } from '@/server/middleware/compose';
import { type AllowanceAction, allowanceService } from '@/server/service/allowance.service';
import { currentPeriod, payoutService } from '@/server/service/payout.service';
import { anchorMuxedAddress, buildPayUri } from '@/server/stellar';

const createSchema = z.object({
  recipientName: z.string().min(1).max(80),
  recipientAddress: z.string().min(1),
  corridor: z.string().min(1).max(80),
  asset: z.enum(['XLM', 'USDC']),
  monthlyAmount: z.string().min(1),
  dayOfMonth: z.coerce.number().int(),
  months: z.coerce.number().int().optional(),
  note: z.string().max(200).optional(),
  signedXdr: z.string().min(1).optional(),
});

const statusSchema = z.object({ action: z.enum(['pause', 'resume', 'end']) });
const recordSchema = z.object({
  txHash: z.string().min(1).optional(),
  amount: z.string().min(1).optional(),
  signedXdr: z.string().min(1).optional(),
});

function pk(ctx: HandlerContext): string {
  return ctx.publicKey as string;
}

async function idParam(ctx: HandlerContext): Promise<string> {
  const params = (await ctx.params) ?? {};
  return String(params.id);
}

export async function listAllowances(_req: NextRequest, ctx: HandlerContext) {
  return ok(await allowanceService.list(pk(ctx)));
}

export async function createAllowance(req: NextRequest, ctx: HandlerContext) {
  const { signedXdr, ...input } = createSchema.parse(await req.json());
  const allowance = signedXdr
    ? await allowanceService.createEscrowed(pk(ctx), input, signedXdr)
    : await allowanceService.create(pk(ctx), input);
  return created(allowance);
}

export async function buildEscrow(req: NextRequest, ctx: HandlerContext) {
  const { signedXdr: _ignore, ...input } = createSchema.parse(await req.json());
  return ok(await allowanceService.buildEscrow(pk(ctx), input));
}

export async function buildRelease(_req: NextRequest, ctx: HandlerContext) {
  const id = await idParam(ctx);
  return ok(await payoutService.buildRelease(id, pk(ctx)));
}

export async function getAllowance(_req: NextRequest, ctx: HandlerContext) {
  const id = await idParam(ctx);
  const allowance = await allowanceService.getOwned(id, pk(ctx));
  const muxedAttribution = anchorMuxedAddress(env.ANCHOR_COLLECTION_PUBLIC_KEY, allowance.id);
  return ok({ ...allowance, muxedAttribution });
}

export async function changeAllowanceStatus(req: NextRequest, ctx: HandlerContext) {
  const id = await idParam(ctx);
  const { action } = statusSchema.parse(await req.json());
  return ok(await allowanceService.changeStatus(id, pk(ctx), action as AllowanceAction));
}

export async function recordPayout(req: NextRequest, ctx: HandlerContext) {
  const id = await idParam(ctx);
  const body = recordSchema.parse(await req.json());
  if (body.signedXdr) {
    return created(await payoutService.recordRelease(id, pk(ctx), { signedXdr: body.signedXdr }));
  }
  if (!body.txHash || !body.amount) {
    throw new AppError('INVALID_INPUT', 'A signed release or a txHash + amount is required', 400);
  }
  return created(
    await payoutService.recordPayment(id, pk(ctx), { txHash: body.txHash, amount: body.amount }),
  );
}

export async function collectPayout(_req: NextRequest, ctx: HandlerContext) {
  const params = (await ctx.params) ?? {};
  const payoutId = String(params.payoutId);
  return ok(await payoutService.markCollected(payoutId, pk(ctx)));
}

export async function payUri(_req: NextRequest, ctx: HandlerContext) {
  const id = await idParam(ctx);
  const allowance = await allowanceService.getOwned(id, pk(ctx));
  const uri = buildPayUri({
    destination: allowance.recipientAddress,
    amount: allowance.monthlyAmount,
    asset: allowance.asset,
    memo: `Bakti allowance ${currentPeriod()}`,
  });
  return ok({ uri });
}
