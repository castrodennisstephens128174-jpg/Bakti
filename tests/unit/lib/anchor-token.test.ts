// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { issueToken, verifyToken } from '@/server/lib/anchor-token';

describe('anchor-token', () => {
  it('issues a token that verifies back to the same account', () => {
    const token = issueToken('GABC123', 300);
    expect(verifyToken(token)).toBe('GABC123');
  });

  it('rejects a tampered payload', () => {
    const token = issueToken('GABC123', 300);
    const [payload, sig] = token.split('.');
    const tampered = `${Buffer.from(JSON.stringify({ account: 'GEVIL', exp: Date.now() / 1000 + 300 })).toString('base64url')}.${sig}`;
    expect(tampered).not.toBe(token);
    expect(verifyToken(tampered)).toBeNull();
    expect(payload).toBeTruthy();
  });

  it('rejects a tampered signature', () => {
    const token = issueToken('GABC123', 300);
    const [payload] = token.split('.');
    expect(verifyToken(`${payload}.deadbeef`)).toBeNull();
  });

  it('rejects an expired token', () => {
    vi.useFakeTimers();
    const token = issueToken('GABC123', 1);
    vi.advanceTimersByTime(2_000);
    expect(verifyToken(token)).toBeNull();
    vi.useRealTimers();
  });

  it('rejects a malformed token', () => {
    expect(verifyToken('not-a-token')).toBeNull();
    expect(verifyToken('')).toBeNull();
  });
});
