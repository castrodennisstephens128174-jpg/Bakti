import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '@/server/config/env';

/**
 * At-rest encryption for the KYC blob (`allowances.kyc_json`). Government IDs
 * are radioactive: they live in the database only until the anchor accepts the
 * customer, and always AES-256-GCM encrypted under KYC_ENCRYPTION_KEY. A leaked
 * database dump must never yield a pile of identity documents.
 *
 * Format: "enc1:" + base64(iv[12] | authTag[16] | ciphertext)
 */

const PREFIX = 'enc1:';

function key(): Buffer {
  const raw = env.KYC_ENCRYPTION_KEY;
  if (!raw) throw new Error('KYC_ENCRYPTION_KEY is not configured');
  return Buffer.from(raw, 'hex');
}

export function encryptKyc(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), enc]).toString('base64');
}

export function decryptKyc(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored; // legacy plaintext rows
  const buf = Buffer.from(stored.slice(PREFIX.length), 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
}
