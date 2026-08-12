// Raw DB operations via Supabase REST API (PostgREST).
// Uses HTTPS (port 443) — bypasses the Supabase connection pool entirely.
// The Session pooler (port 5432) allows only 15 connections which get
// exhausted on Vercel serverless. REST API has no such limit.

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

// Generic INSERT via Supabase REST API — returns the inserted row.
export async function rawInsert(table: string, data: Record<string, any>): Promise<Record<string, any> | null> {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("[rawInsert] Missing SUPABASE_URL or SERVICE_ROLE_KEY");
    return null;
  }
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
export async function rawUpdate(
  table: string,
  id: string,
  data: Record<string, any>
): Promise<Record<string, any> | null> {
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
