import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { type AuthNonce, authNonces, type Session, sessions } from '@/server/db/schema';

export const authNonceRepo = {
  async insert(row: { nonce: string; publicKey: string; expiresAt: Date }): Promise<void> {
    await db.insert(authNonces).values(row);
  },

  async findActive(publicKey: string, nonce: string, now: Date): Promise<AuthNonce | undefined> {
    const [row] = await db
      .select()
      .from(authNonces)
      .where(
        and(
          eq(authNonces.publicKey, publicKey),
          eq(authNonces.nonce, nonce),
          isNull(authNonces.consumedAt),
          gt(authNonces.expiresAt, now),
        ),
      );
    return row;
  },

  async consume(nonce: string): Promise<void> {
    await db.update(authNonces).set({ consumedAt: new Date() }).where(eq(authNonces.nonce, nonce));
  },
};

export const sessionRepo = {
  async insert(row: { publicKey: string; expiresAt: Date }): Promise<string> {
    const [created] = await db.insert(sessions).values(row).returning({ id: sessions.id });
    return created.id;
  },

  async findById(id: string): Promise<Session | undefined> {
    const [row] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
    return row;
  },

  async delete(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  },
};
