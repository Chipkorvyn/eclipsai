// lib/db.ts
import { Pool } from 'pg';

// In Next.js dev mode, you might get re-imported. We store the Pool in global to avoid duplicates.
let pool: Pool;

if (!global.__pool) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  global.__pool = pool;
} else {
  pool = global.__pool;
}

export default pool;
