import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AppError } from '@/server/lib/http';
import type { HandlerContext } from '@/server/middleware/compose';
import { anchorServerService } from '@/server/service/anchor-server.service';

function bearerToken(req: NextRequest): string | undefined {
  const header = req.headers.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' ? token : undefined;
}

function homeDomain(req: NextRequest, searchParams: URLSearchParams): string {
  return searchParams.get('home_domain') ?? req.headers.get('host') ?? '';
}

export function stellarToml(req: NextRequest) {
  const url = new URL(req.url);
  const toml = anchorServerService.stellarToml(url.host);
  return new NextResponse(toml, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

const challengeQuerySchema = z.object({ account: z.string().min(1) });

export function requestChallenge(req: NextRequest) {
  const url = new URL(req.url);
  const { account } = challengeQuerySchema.parse({ account: url.searchParams.get('account') });
  const transaction = anchorServerService.createChallenge(
    account,
    homeDomain(req, url.searchParams),
  );
  return NextResponse.json({ transaction });
}

const verifyChallengeSchema = z.object({ transaction: z.string().min(1) });

export async function verifyChallenge(req: NextRequest) {
  const url = new URL(req.url);
  const { transaction } = verifyChallengeSchema.parse(await req.json());
  const token = anchorServerService.verifyChallenge(transaction, homeDomain(req, url.searchParams));
  return NextResponse.json({ token });
}

const customerSchema = z.record(z.string(), z.string());

export async function putCustomer(req: NextRequest) {
  const fields = customerSchema.parse(await req.json());
  const { id } = await anchorServerService.putCustomer(bearerToken(req), fields);
  return NextResponse.json({ id });
}

const createTransactionSchema = z.object({
  amount: z.string().min(1),
  asset_code: z.string().min(1),
  receiver_id: z.string().min(1),
  funding_method: z.string().min(1),
});

export async function createTransaction(req: NextRequest) {
  const body = createTransactionSchema.parse(await req.json());
  const { id, status } = await anchorServerService.createTransaction(bearerToken(req), {
    amount: body.amount,
    assetCode: body.asset_code,
    receiverId: body.receiver_id,
    fundingMethod: body.funding_method,
  });
  return NextResponse.json({ id, status });
}

export async function getTransaction(req: NextRequest, ctx: HandlerContext) {
  const params = (await ctx.params) ?? {};
  const id = params.id;
  if (typeof id !== 'string') {
    throw new AppError('INVALID_INPUT', 'Missing transaction id', 400);
  }
  const transaction = await anchorServerService.getTransaction(bearerToken(req), id);
  return NextResponse.json({ transaction });
}
