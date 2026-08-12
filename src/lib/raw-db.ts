import { Pool } from "pg";

// Raw pg Pool for write operations (create/update/delete).
// Bypasses Prisma entirely — more reliable on Vercel serverless
// because it doesn't go through the safeWrap proxy.
let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  pool = new Pool({
    connectionString: connectionString || "postgresql://localhost:5432/postgres",
    max: 2,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
  });
  return pool;
}

// Generic INSERT helper — returns the inserted row.
export async function rawInsert(table: string, data: Record<string, any>): Promise<Record<string, any> | null> {
  const p = getPool();
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  const colList = columns.join(", ");

  try {
    const res = await p.query(
      `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return res.rows[0] || null;
  } catch (err: any) {
    console.error(`[rawInsert] ${table} failed:`, err?.message);
    return null;
  }
}

// Generic UPDATE helper — returns the updated row.
export async function rawUpdate(
  table: string,
  id: string,
  data: Record<string, any>
): Promise<Record<string, any> | null> {
  const p = getPool();
  const columns = Object.keys(data);
  const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(", ");
  const values = [...Object.values(data), id];

  try {
    const res = await p.query(
      `UPDATE ${table} SET ${setClause} WHERE id = $${columns.length + 1} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  } catch (err: any) {
    console.error(`[rawUpdate] ${table} failed:`, err?.message);
    return null;
  }
}

// Generic DELETE helper.
export async function rawDelete(table: string, id: string): Promise<boolean> {
  const p = getPool();
  try {
    await p.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    return true;
  } catch (err: any) {
    console.error(`[rawDelete] ${table} failed:`, err?.message);
    return false;
  }
}

// Convert camelCase to snake_case for DB column names.
export function toSnake(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    const snake = k.replace(/([A-Z])/g, "_$1").toLowerCase();
    out[snake] = v;
  }
  return out;
}

// Convert snake_case row back to camelCase for the API response.
export function toCamel(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  }
  return out;
}
