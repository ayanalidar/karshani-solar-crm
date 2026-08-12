// Supabase REST API helpers for reads + writes.
// Uses HTTPS (port 443) — no connection limit.
// Falls back from Prisma when the pg Pool is exhausted.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getHeaders() {
  return {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

// SELECT all rows from a table via REST API.
export async function rawSelect(table: string, orderBy?: string, limit = 100): Promise<Record<string, any>[] | null> {
  if (!SUPABASE_URL || !SERVICE_ROLE) return null;
  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
    if (orderBy) {
      // REST API uses column_name.desc or column_name.asc
      const [col, dir] = orderBy.includes(".") ? orderBy.split(".") : [orderBy, "asc"];
      const dbCol = col.replace(/([A-Z])/g, "_$1").toLowerCase();
      url += `&order=${dbCol}.${dir}`;
    }
    if (limit) url += `&limit=${limit}`;

    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) {
      console.error(`[rawSelect] ${table}: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err: any) {
    console.error(`[rawSelect] ${table} failed:`, err?.message);
    return null;
  }
}

// SELECT single row by ID via REST API.
export async function rawSelectOne(table: string, id: string): Promise<Record<string, any> | null> {
  if (!SUPABASE_URL || !SERVICE_ROLE) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}&select=*&limit=1`,
      { headers: getHeaders(), cache: "no-store" }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return (rows && rows[0]) || null;
  } catch (err: any) {
    console.error(`[rawSelectOne] ${table} failed:`, err?.message);
    return null;
  }
}

// Generic INSERT via Supabase REST API.
export async function rawInsert(table: string, data: Record<string, any>): Promise<Record<string, any> | null> {
  if (!SUPABASE_URL || !SERVICE_ROLE) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`[rawInsert] ${table}: ${res.status} ${txt.slice(0, 200)}`);
      return null;
    }
    const rows = await res.json();
    return (rows && rows[0]) || null;
  } catch (err: any) {
    console.error(`[rawInsert] ${table} failed:`, err?.message);
    return null;
  }
}

// Generic UPDATE via Supabase REST API.
export async function rawUpdate(table: string, id: string, data: Record<string, any>): Promise<Record<string, any> | null> {
  if (!SUPABASE_URL || !SERVICE_ROLE) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return (rows && rows[0]) || null;
  } catch (err: any) {
    console.error(`[rawUpdate] ${table} failed:`, err?.message);
    return null;
  }
}

// Generic DELETE via Supabase REST API.
export async function rawDelete(table: string, id: string): Promise<boolean> {
  if (!SUPABASE_URL || !SERVICE_ROLE) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return res.ok;
  } catch (err: any) {
    console.error(`[rawDelete] ${table} failed:`, err?.message);
    return false;
  }
}

// Convert camelCase to snake_case.
export function toSnake(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/([A-Z])/g, "_$1").toLowerCase()] = v;
  }
  return out;
}

// Convert snake_case to camelCase.
export function toCamel(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return out;
}

// Convert array of snake_case rows to camelCase.
export function toCamelArray(rows: Record<string, any>[]): Record<string, any>[] {
  return rows.map(toCamel);
}
