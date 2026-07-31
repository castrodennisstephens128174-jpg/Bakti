import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAnchorToml } from '@/server/stellar/anchor/toml';

const VALID_TOML = `
SIGNING_KEY = "GAYNC2CGH2ZHTQVM4HH55MYWIXR6PDZIDKXEQTTKYOJAFOU4WH663JGZ"
WEB_AUTH_ENDPOINT = "http://localhost:8180/auth"
DIRECT_PAYMENT_SERVER = "http://localhost:8180/sep31"
KYC_SERVER = "http://localhost:8180/sep12"

[[CURRENCIES]]
code = "USDC"
issuer = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"

[[CURRENCIES]]
code = "native"
`;

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchAnchorToml', () => {
  it('parses signing key, endpoints, and currencies from a valid TOML', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(VALID_TOML, { status: 200 }) as never);

    const toml = await fetchAnchorToml('localhost:8180');

    expect(fetch).toHaveBeenCalledWith('http://localhost:8180/.well-known/stellar.toml');
    expect(toml).toEqual({
      signingKey: 'GAYNC2CGH2ZHTQVM4HH55MYWIXR6PDZIDKXEQTTKYOJAFOU4WH663JGZ',
      webAuthEndpoint: 'http://localhost:8180/auth',
      directPaymentServer: 'http://localhost:8180/sep31',
      kycServer: 'http://localhost:8180/sep12',
      currencies: [
        { code: 'USDC', issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5' },
        { code: 'native', issuer: undefined },
      ],
    });
  });

  it('uses https for a non-localhost home domain', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(VALID_TOML, { status: 200 }) as never);
    await fetchAnchorToml('anchor.example.com');
    expect(fetch).toHaveBeenCalledWith('https://anchor.example.com/.well-known/stellar.toml');
  });

  it('throws NOT_FOUND on a non-2xx response', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 404 }) as never);
    await expect(fetchAnchorToml('localhost:8180')).rejects.toThrow(/not found/i);
  });

  it('throws on a network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(fetchAnchorToml('localhost:8180')).rejects.toThrow(/could not reach/i);
  });

  it('throws on malformed TOML', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('not = [valid toml', { status: 200 }) as never);
    await expect(fetchAnchorToml('localhost:8180')).rejects.toThrow(/not valid toml/i);
  });

  it('throws when a required field is missing', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('SIGNING_KEY = "G..."', { status: 200 }) as never,
    );
    await expect(fetchAnchorToml('localhost:8180')).rejects.toThrow(/missing a required/i);
  });

  it('returns an empty currencies list when CURRENCIES is absent', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        `SIGNING_KEY = "G..."
WEB_AUTH_ENDPOINT = "http://localhost:8180/auth"
DIRECT_PAYMENT_SERVER = "http://localhost:8180/sep31"
KYC_SERVER = "http://localhost:8180/sep12"`,
        { status: 200 },
      ) as never,
    );
    const toml = await fetchAnchorToml('localhost:8180');
    expect(toml.currencies).toEqual([]);
  });
});
