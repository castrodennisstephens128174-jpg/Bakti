import { Pool } from 'pg';

const globalForDb = globalThis;

export const db =
  globalForDb.__anchorPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

globalForDb.__anchorPool = db;
