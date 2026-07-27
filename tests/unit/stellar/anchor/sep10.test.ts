// @vitest-environment node
import { Keypair, Networks, WebAuth } from '@stellar/stellar-sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticate } from '@/server/stellar/anchor/sep10';
import type { AnchorToml } from '@/server/stellar/anchor/toml';

const HOME_DOMAIN = 'localhost:8180';
const PASSPHRASE = Networks.TESTNET;

let keyId = 0;
function keypair(): Keypair {
  keyId += 1;
  return Keypair.fromRawEd25519Seed(Buffer.alloc(32, keyId));
}

function anchorToml(overrides: Partial<AnchorToml> = {}, serverKp: Keypair): AnchorToml {
  return {
    signingKey: serverKp.publicKey(),
    webAuthEndpoint: `http://${HOME_DOMAIN}/auth`,
    directPaymentServer: `http://${HOME_DOMAIN}/sep31`,
    kycServer: `http://${HOME_DOMAIN}/sep12`,
    currencies: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('authenticate (SEP-10)', () => {
  it('validates a real anchor-signed challenge, signs it, and returns the JWT', async () => {
    const serverKp = keypair();
    const clientKp = keypair();
    const toml = anchorToml({}, serverKp);

    const challengeXdr = WebAuth.buildChallengeTx(
      serverKp,
      clientKp.publicKey(),
      HOME_DOMAIN,
      300,
      PASSPHRASE,
      HOME_DOMAIN,
    );

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ transaction: challengeXdr }), { status: 200 }) as never,
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'jwt-abc-123' }), { status: 200 }) as never,
      );

    const token = await authenticate(toml, clientKp, {
      networkPassphrase: PASSPHRASE,
      homeDomain: HOME_DOMAIN,
    });

    expect(token).toBe('jwt-abc-123');
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(`http://${HOME_DOMAIN}/auth?account=${clientKp.publicKey()}`),
    );
    const postCall = vi.mocked(fetch).mock.calls[1];
    expect(postCall[0]).toBe(toml.webAuthEndpoint);
    const postedBody = JSON.parse((postCall[1] as RequestInit).body as string);
    expect(typeof postedBody.transaction).toBe('string');
  });

  it('rejects a challenge signed by the wrong server key', async () => {
    const realServerKp = keypair();
    const impostorKp = keypair();
    const clientKp = keypair();
    // TOML claims realServerKp's signing key, but the challenge is actually signed by impostorKp.
    const toml = anchorToml({}, realServerKp);

    const challengeXdr = WebAuth.buildChallengeTx(
      impostorKp,
      clientKp.publicKey(),
      HOME_DOMAIN,
      300,
      PASSPHRASE,
      HOME_DOMAIN,
    );

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ transaction: challengeXdr }), { status: 200 }) as never,
    );

    await expect(
      authenticate(toml, clientKp, { networkPassphrase: PASSPHRASE, homeDomain: HOME_DOMAIN }),
    ).rejects.toThrow(/failed validation/i);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects a challenge built for the wrong network passphrase', async () => {
    const serverKp = keypair();
    const clientKp = keypair();
    const toml = anchorToml({}, serverKp);

    const challengeXdr = WebAuth.buildChallengeTx(
      serverKp,
      clientKp.publicKey(),
      HOME_DOMAIN,
      300,
      Networks.PUBLIC, // wrong passphrase
      HOME_DOMAIN,
    );

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ transaction: challengeXdr }), { status: 200 }) as never,
    );

    await expect(
      authenticate(toml, clientKp, { networkPassphrase: PASSPHRASE, homeDomain: HOME_DOMAIN }),
    ).rejects.toThrow(/failed validation/i);
  });

  it('throws when the GET /auth request fails', async () => {
    const serverKp = keypair();
    const clientKp = keypair();
    const toml = anchorToml({}, serverKp);
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 500 }) as never);

    await expect(
      authenticate(toml, clientKp, { networkPassphrase: PASSPHRASE, homeDomain: HOME_DOMAIN }),
    ).rejects.toThrow(/challenge request failed/i);
  });

  it('throws when the anchor rejects the signed challenge', async () => {
    const serverKp = keypair();
    const clientKp = keypair();
    const toml = anchorToml({}, serverKp);
    const challengeXdr = WebAuth.buildChallengeTx(
      serverKp,
      clientKp.publicKey(),
      HOME_DOMAIN,
      300,
      PASSPHRASE,
      HOME_DOMAIN,
    );

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ transaction: challengeXdr }), { status: 200 }) as never,
      )
      .mockResolvedValueOnce(new Response('', { status: 401 }) as never);

    await expect(
      authenticate(toml, clientKp, { networkPassphrase: PASSPHRASE, homeDomain: HOME_DOMAIN }),
    ).rejects.toThrow(/authentication rejected/i);
  });
});
