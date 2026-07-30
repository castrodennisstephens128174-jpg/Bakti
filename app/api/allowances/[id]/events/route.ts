export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import type { NextRequest } from 'next/server';
import type { HandlerContext } from '@/server/middleware/compose';
import { compose } from '@/server/middleware/compose';
import { withAuth } from '@/server/middleware/withAuth';
import { withError } from '@/server/middleware/withError';
import { allowanceService } from '@/server/service/allowance.service';

/**
 * Change-driven live feed for one allowance (SSE). The server watches the DB
 * and pushes a snapshot ONLY when payout state actually changes — the client
 * sits idle otherwise. Each connection lives ~50s (serverless budget) and the
 * client silently reconnects, so from the UI's perspective it is a single
 * stream of "something changed" events.
 */
async function events(_req: NextRequest, ctx: HandlerContext) {
  const params = (await ctx.params) ?? {};
  const id = String(params.id);
  const publicKey = ctx.publicKey as string;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const push = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      let lastSig = '';
      try {
        for (let tick = 0; tick < 20; tick++) {
          const allowance = await allowanceService.getOwned(id, publicKey).catch(() => null);
          if (!allowance) break;
          const sig = allowance.payouts
            .map((p) => `${p.id}:${p.status}:${p.pickupRef ?? ''}:${p.sep31Status ?? ''}`)
            .join('|');
          if (sig !== lastSig) {
            lastSig = sig;
            const { kycJson: _kyc, ...safe } = allowance;
            push(safe);
          } else {
            controller.enqueue(encoder.encode(': keepalive\n\n'));
          }
          await new Promise((r) => setTimeout(r, 2500));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
    },
  });
}

export const GET = compose(withError, withAuth)(events);
