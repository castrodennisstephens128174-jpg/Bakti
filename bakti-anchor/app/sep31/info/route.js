export const dynamic = 'force-dynamic';

const ASSET_INFO = {
  quotes_supported: false,
  quotes_required: false,
  fee_fixed: 0,
  min_amount: 0.1,
  max_amount: 10000,
  sep12: {
    sender: { types: { 'sep31-sender': { description: 'Sending party — basic KYC' } } },
    receiver: { types: { 'sep31-receiver': { description: 'Receiving party — basic KYC' } } },
  },
};

export async function GET() {
  return Response.json(
    { receive: { USDC: ASSET_INFO, native: ASSET_INFO } },
    { headers: { 'access-control-allow-origin': '*' } },
  );
}
