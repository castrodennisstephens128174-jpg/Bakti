import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { putCustomer } from '@/server/stellar/anchor/sep12';
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

describe('putCustomer (SEP-12)', () => {
  it('PUTs the fields with a bearer token and returns the customer id', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 'cust-123' }), { status: 202 }) as never,
    );

    const result = await putCustomer(TOML, 'jwt-abc', {
      first_name: 'Maria',
      last_name: 'Santos',
      email_address: 'maria@example.com',
    });

    expect(result).toEqual({ customerId: 'cust-123' });
    expect(fetch).toHaveBeenCalledWith('http://localhost:8180/sep12/customer', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer jwt-abc',
      },
      body: JSON.stringify({
        first_name: 'Maria',
        last_name: 'Santos',
        email_address: 'maria@example.com',
      }),
    });
  });

  it('throws INVALID_INPUT with the anchor detail on a 400 (missing required field)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('bank_account_number is required', { status: 400 }) as never,
    );
    await expect(putCustomer(TOML, 'jwt-abc', { first_name: 'Maria' })).rejects.toThrow(
      /bank_account_number is required/,
    );
  });

  it('throws on a 401 (bad or expired token)', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 401 }) as never);
    await expect(putCustomer(TOML, 'stale-jwt', {})).rejects.toThrow(/rejected \(401\)/);
  });

  it('throws when the response is missing an id', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ status: 'ACCEPTED' }), { status: 202 }) as never,
    );
    await expect(putCustomer(TOML, 'jwt-abc', {})).rejects.toThrow(/missing "id"/);
  });

  it('throws on a network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(putCustomer(TOML, 'jwt-abc', {})).rejects.toThrow(/could not reach/i);
  });
});
