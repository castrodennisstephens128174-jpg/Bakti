export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import type { NextRequest } from 'next/server';
import { env } from '@/server/config/env';
import { runKeeper } from '@/server/service/keeper.service';

/** Hourly keeper tick (Vercel Cron sends `Authorization: Bearer CRON_SECRET`). */
export async function GET(req: NextRequest) {
  if (!env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  const results = await runKeeper();
  return Response.json({ ok: true, processed: results.length, results });
}

export const POST = GET;
