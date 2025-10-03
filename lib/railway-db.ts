/**
 * Railway PostgreSQL Database Connection
 *
 * Uses native pg library with Railway's DATABASE_URL
 */

import { Pool } from 'pg';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway.app') ? { rejectUnauthorized: false } : undefined,
});

// Helper to execute SQL queries
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Tagged template for SQL queries (similar to Vercel's sql`` syntax)
export async function sql(strings: TemplateStringsArray, ...values: any[]) {
  const client = await pool.connect();
  try {
    // Build query from template strings
    let queryText = '';
    const params: any[] = [];

    for (let i = 0; i < strings.length; i++) {
      queryText += strings[i];
      if (i < values.length) {
        params.push(values[i]);
        queryText += `$${params.length}`;
      }
    }

    const result = await client.query(queryText, params);
    return { rows: result.rows, rowCount: result.rowCount };
  } finally {
    client.release();
  }
}

// Export pool for advanced usage
export { pool };

export default sql;
