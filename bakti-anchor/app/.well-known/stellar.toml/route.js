import { Keypair } from '@stellar/stellar-sdk';
import { hostOf } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const host = hostOf(request);
  const signingKey = Keypair.fromSecret(process.env.ANCHOR_SIGNING_SECRET).publicKey();
  const toml = `VERSION = "0.1.0"
NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
SIGNING_KEY = "${signingKey}"
ACCOUNTS = ["${process.env.RECEIVE_ACCOUNT}"]
WEB_AUTH_ENDPOINT = "https://${host}/auth"
KYC_SERVER = "https://${host}/sep12"
DIRECT_PAYMENT_SERVER = "https://${host}/sep31"

[[CURRENCIES]]
code = "USDC"
issuer = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
status = "test"

[[CURRENCIES]]
code = "native"
status = "test"

[DOCUMENTATION]
ORG_NAME = "Bakti Mock Receiving Anchor (testnet only)"
`;
  return new Response(toml, {
    headers: { 'content-type': 'text/plain', 'access-control-allow-origin': '*' },
  });
}
