import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import {
  type AnchorCustomer,
  type AnchorTransaction,
  anchorCustomers,
  anchorTransactions,
} from '@/server/db/schema';

export const anchorCustomerRepo = {
  async insert(row: { type: string; fields: Record<string, string> }): Promise<string> {
    const [created] = await db.insert(anchorCustomers).values(row).returning({
      id: anchorCustomers.id,
    });
    return created.id;
  },

  async findById(id: string): Promise<AnchorCustomer | undefined> {
    const [row] = await db.select().from(anchorCustomers).where(eq(anchorCustomers.id, id));
    return row;
  },
};

export const anchorTransactionRepo = {
  async insert(row: {
    amountIn: string;
    assetCode: string;
    receiverId: string;
    fundingMethod: string;
    stellarAccountId: string;
    stellarMemo: string;
  }): Promise<string> {
    const [created] = await db.insert(anchorTransactions).values(row).returning({
      id: anchorTransactions.id,
    });
    return created.id;
  },

  async findById(id: string): Promise<AnchorTransaction | undefined> {
    const [row] = await db.select().from(anchorTransactions).where(eq(anchorTransactions.id, id));
    return row;
  },
};
