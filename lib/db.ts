// lib/db.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

// Configure the PostgreSQL connection pool
// Ensure DATABASE_URL is set in your environment, e.g.:
// postgres://user:password@host:port/database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false }, // uncomment if using SSL
});

// Create the Drizzle ORM client
export const db = drizzle(pool, {
  logger: process.env.NODE_ENV === 'development',
});

// Optionally export the pool for raw queries
export { pool };
