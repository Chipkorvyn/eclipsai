// lib/db.ts
import { Pool } from 'pg';

// For Next.js hot reload, we store pool in global to avoid duplicates:
let pool: Pool;

if (!global.__pool) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // ssl: { rejectUnauthorized: false }, // Uncomment if Neon requires SSL
  });
  global.__pool = pool;
} else {
  pool = global.__pool;
}

export default pool;
