import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPaymentStatus, sendPayment } from '@/server/stellar/anchor/sep31';
import type { AnchorToml } from '@/server/stellar/anchor/toml';

const TOML: AnchorToml = {
  signingKey: 'GAYNC2CGH2ZHTQVM4HH55MYWIXR6PDZIDKXEQTTKYOJAFOU4WH663JGZ',
  webAuthEndpoint: 'http://localhost:8180/auth',
  directPaymentServer: 'http://localhost:8180/sep31',
  kycServer: 'http://localhost:8180/sep12',
  currencies: [],
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sendPayment (SEP-31)', () => {
  it('POSTs the payment with a bearer token and returns the transaction id', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 'tx-1' }), { status: 201 }) as never,
    );

    const result = await sendPayment(TOML, 'jwt-abc', {
      amount: '50',
      assetCode: 'USDC',
      receiverId: 'cust-1',
      fundingMethod: 'CASH',
    });

    expect(result).toEqual({ transactionId: 'tx-1' });
    expect(fetch).toHaveBeenCalledWith('http://localhost:8180/sep31/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer jwt-abc',
      },
      body: JSON.stringify({
        amount: '50',
        asset_code: 'USDC',
        receiver_id: 'cust-1',
        funding_method: 'CASH',
        fields: { transaction: {} },
      }),
    });
  });

  it('rejects an amount outside the anchor limits (400)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('amount exceeds max_amount', { status: 400 }) as never,
    );
    await expect(
      sendPayment(TOML, 'jwt-abc', {
        amount: '999999',
        assetCode: 'USDC',
        receiverId: 'cust-1',
        fundingMethod: 'CASH',
      }),
    ).rejects.toThrow(/exceeds max_amount/);
  });

  it('throws when the response is missing an id', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 201 }) as never);
    await expect(
      sendPayment(TOML, 'jwt-abc', {
        amount: '50',
        assetCode: 'USDC',
        receiverId: 'cust-1',
        fundingMethod: 'CASH',
      }),
    ).rejects.toThrow(/missing "id"/);
  });
});

describe('getPaymentStatus (SEP-31)', () => {
  it('GETs the transaction and maps its stellar payment fields', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          transaction: {
            id: 'tx-1',
            status: 'pending_sender',
            amount_in: '50',
            stellar_account_id: 'GDXLIJKLBCE55IYHSBKAWSTPU5CP4NBP4XGRMYHR4CJE4UEJQTTPVCQG',
            stellar_memo: '18266',
            stellar_memo_type: 'id',
          },
        }),
        { status: 200 },
      ) as never,
    );

    const status = await getPaymentStatus(TOML, 'jwt-abc', 'tx-1');

    expect(status).toEqual({
      id: 'tx-1',
      status: 'pending_sender',
      amountIn: '50',
      stellarAccountId: 'GDXLIJKLBCE55IYHSBKAWSTPU5CP4NBP4XGRMYHR4CJE4UEJQTTPVCQG',
      stellarMemo: '18266',
      stellarMemoType: 'id',
    });
    expect(fetch).toHaveBeenCalledWith('http://localhost:8180/sep31/transactions/tx-1', {
      headers: { Authorization: 'Bearer jwt-abc' },
    });
  });

  it('throws NOT_FOUND for an unknown transaction id', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 404 }) as never);
    await expect(getPaymentStatus(TOML, 'jwt-abc', 'missing')).rejects.toThrow(/not found/i);
  });
});
