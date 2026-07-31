import type { NextRequest } from 'next/server';

export type RouteHandler = (req: NextRequest, ctx: HandlerContext) => Promise<Response> | Response;

export type HandlerContext = {
  params?: Promise<Record<string, string | string[] | undefined>>;
  publicKey?: string;
  [k: string]: unknown;
};

export type Middleware = (handler: RouteHandler) => RouteHandler;

export function compose(...middlewares: Middleware[]) {
  return (
    handler: RouteHandler,
  ): ((req: NextRequest, ctx: HandlerContext) => Promise<Response> | Response) => {
    const composed = middlewares.reduceRight((acc, mw) => mw(acc), handler);
    return (req: NextRequest, ctx: HandlerContext) => composed(req, ctx);
  };
}
