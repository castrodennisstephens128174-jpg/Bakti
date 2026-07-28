import { Keypair, WebAuth } from '@stellar/stellar-sdk';
import {
  env,
  STELLAR_NETWORK_PASSPHRASE_VALUE,
  USDC_ASSET_ISSUER_VALUE,
} from '@/server/config/env';
import { anchorCustomerRepo, anchorTransactionRepo } from '@/server/db/repos/anchor.repo';
import { issueToken, verifyToken } from '@/server/lib/anchor-token';
import { AppError } from '@/server/lib/http';

const CHALLENGE_TTL_SECONDS = 300;
const TOKEN_TTL_SECONDS = 3600;
const SUPPORTED_ASSET_CODE = 'USDC';
const SUPPORTED_FUNDING_METHODS = ['bank_account'];

function serverKeypair(): Keypair {
  if (!env.ANCHOR_STUB_SERVER_SIGNING_SEED) {
    throw new AppError(
      'NOT_FOUND',
      'Anchor stub is not configured (ANCHOR_STUB_SERVER_SIGNING_SEED unset)',
      404,
    );
  }
  return Keypair.fromSecret(env.ANCHOR_STUB_SERVER_SIGNING_SEED);
}

function requireAccount(bearerToken: string | undefined): string {
  const account = bearerToken ? verifyToken(bearerToken) : null;
  if (!account) {
    throw new AppError('UNAUTHORIZED', 'Missing or invalid bearer token', 401);
  }
  return account;
}

// Matches src/server/stellar/anchor/toml.ts's own localhost detection, so this
// stub's advertised endpoints are reachable from the SAME process during local dev.
function anchorScheme(homeDomain: string): string {
  return homeDomain.startsWith('localhost') || homeDomain.startsWith('127.0.0.1')
    ? 'http'
    : 'https';
}

export const anchorServerService = {
  /** SEP-1: this stub's own stellar.toml, describing SEP-10/12/31 endpoints. */
  stellarToml(homeDomain: string): string {
    const signingKey = serverKeypair().publicKey();
    const scheme = anchorScheme(homeDomain);
    return [
      `SIGNING_KEY = "${signingKey}"`,
      `NETWORK_PASSPHRASE = "${STELLAR_NETWORK_PASSPHRASE_VALUE}"`,
      `WEB_AUTH_ENDPOINT = "${scheme}://${homeDomain}/api/anchor/auth"`,
      `KYC_SERVER = "${scheme}://${homeDomain}/api/anchor/kyc"`,
      `DIRECT_PAYMENT_SERVER = "${scheme}://${homeDomain}/api/anchor/sep31"`,
      '',
      '[[CURRENCIES]]',
      `code = "${SUPPORTED_ASSET_CODE}"`,
      `issuer = "${USDC_ASSET_ISSUER_VALUE}"`,
      'status = "test"',
    ].join('\n');
  },

  /** SEP-10: build a challenge transaction for the given client account. */
  createChallenge(clientAccountId: string, homeDomain: string): string {
    return WebAuth.buildChallengeTx(
      serverKeypair(),
      clientAccountId,
      homeDomain,
      CHALLENGE_TTL_SECONDS,
      STELLAR_NETWORK_PASSPHRASE_VALUE,
      homeDomain,
    );
  },

  /** SEP-10: verify a signed challenge and mint a bearer token for its account. */
  verifyChallenge(signedTxXdr: string, homeDomain: string): string {
    const server = serverKeypair();

    let clientAccountId: string;
    try {
      ({ clientAccountID: clientAccountId } = WebAuth.readChallengeTx(
        signedTxXdr,
        server.publicKey(),
        STELLAR_NETWORK_PASSPHRASE_VALUE,
        homeDomain,
        homeDomain,
      ));
    } catch (cause) {
      throw new AppError('UNAUTHORIZED', 'SEP-10 challenge failed validation', 401, cause);
    }

    try {
      WebAuth.verifyChallengeTxSigners(
        signedTxXdr,
        server.publicKey(),
        STELLAR_NETWORK_PASSPHRASE_VALUE,
        [clientAccountId],
        homeDomain,
        homeDomain,
      );
    } catch (cause) {
      throw new AppError('UNAUTHORIZED', 'SEP-10 signature verification failed', 401, cause);
    }

    return issueToken(clientAccountId, TOKEN_TTL_SECONDS);
  },

  /** SEP-12: register KYC fields for a customer, return its id. */
  async putCustomer(
    bearerToken: string | undefined,
    fields: Record<string, string>,
  ): Promise<{ id: string }> {
    requireAccount(bearerToken);
    if (!fields.first_name || !fields.last_name || !fields.email_address) {
      throw new AppError(
        'INVALID_INPUT',
        'Missing required customer fields: first_name, last_name, email_address',
        400,
      );
    }
    const id = await anchorCustomerRepo.insert({ type: fields.type ?? 'sep31-receiver', fields });
    return { id };
  },

  /** SEP-31: register a payment intent, return its id and pending status. */
  async createTransaction(
    bearerToken: string | undefined,
    params: {
      amount: string;
      assetCode: string;
      receiverId: string;
      fundingMethod: string;
    },
  ): Promise<{ id: string; status: string }> {
    requireAccount(bearerToken);

    if (params.assetCode !== SUPPORTED_ASSET_CODE) {
      throw new AppError(
        'INVALID_INPUT',
        `Unsupported asset_code (only ${SUPPORTED_ASSET_CODE} is enabled)`,
        400,
      );
    }
    if (!SUPPORTED_FUNDING_METHODS.includes(params.fundingMethod)) {
      throw new AppError(
        'INVALID_INPUT',
        `Unsupported funding_method (supported: ${SUPPORTED_FUNDING_METHODS.join(', ')})`,
        400,
      );
    }
    const customer = await anchorCustomerRepo.findById(params.receiverId);
    if (!customer) {
      throw new AppError('NOT_FOUND', `Unknown receiver_id ${params.receiverId}`, 404);
    }

    const stellarMemo = Math.floor(Math.random() * 2 ** 32).toString();
    const id = await anchorTransactionRepo.insert({
      amountIn: params.amount,
      assetCode: params.assetCode,
      receiverId: params.receiverId,
      fundingMethod: params.fundingMethod,
      stellarAccountId: serverKeypair().publicKey(),
      stellarMemo,
    });
    return { id, status: 'pending_sender' };
  },

  /** SEP-31: current status of a registered transaction. */
  async getTransaction(
    bearerToken: string | undefined,
    id: string,
  ): Promise<{
    id: string;
    status: string;
    amount_in: string;
    stellar_account_id: string;
    stellar_memo: string;
    stellar_memo_type: string;
  }> {
    requireAccount(bearerToken);
    const tx = await anchorTransactionRepo.findById(id);
    if (!tx) {
      throw new AppError('NOT_FOUND', `Transaction ${id} not found`, 404);
    }
    return {
      id: tx.id,
      status: tx.status,
      amount_in: tx.amountIn,
      stellar_account_id: tx.stellarAccountId,
      stellar_memo: tx.stellarMemo,
      stellar_memo_type: tx.stellarMemoType,
    };
  },
};
