import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Pool } from "pg";

// Diagnostics endpoint — returns env var status + DB connection test.
// Safe to expose (no secrets leaked, only boolean + error messages).
export async function GET() {
  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  const hasDirectUrl = Boolean(process.env.DIRECT_URL);
  const hasAuthSecret = Boolean(process.env.AUTH_SECRET);
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasSupabaseAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // --- Test 1: Prisma ORM ---
  let prismaStatus: "ok" | "error" | "empty" = "empty";
  let prismaError = "";
  let prismaProductCount = 0;
  try {
    const products = await prisma.product.findMany({ select: { id: true } });
    prismaProductCount = Array.isArray(products) ? products.length : 0;
    prismaStatus = prismaProductCount > 0 ? "ok" : "empty";
  } catch (err: any) {
    prismaStatus = "error";
    prismaError = err?.message || String(err);
  }

  // --- Test 2: Raw pg connection (bypasses Prisma entirely) ---
  let rawStatus: "ok" | "error" | "empty" = "empty";
  let rawError = "";
  let rawProductCount = 0;
  let rawTableList: string[] = [];
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  if (connectionString) {
    let pool: Pool | null = null;
    try {
      pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10000 });
      const res = await pool.query("SELECT COUNT(*)::int as cnt FROM products");
      rawProductCount = res.rows[0]?.cnt || 0;
      rawStatus = rawProductCount > 0 ? "ok" : "empty";

      // Also list all tables to verify schema
      const tables = await pool.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
      );
      rawTableList = tables.rows.map((r: any) => r.tablename);
    } catch (err: any) {
      rawStatus = "error";
      rawError = err?.message || String(err);
    } finally {
      if (pool) await pool.end();
    }
  }

  // Show masked connection string
  let maskedUrl = "";
  try {
    const u = new URL(connectionString);
    maskedUrl = `${u.protocol}//***:***@${u.host}${u.pathname}`;
  } catch {
    maskedUrl = connectionString ? "(invalid URL format)" : "(not set)";
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      DATABASE_URL_set: hasDbUrl,
      DIRECT_URL_set: hasDirectUrl,
      AUTH_SECRET_set: hasAuthSecret,
      NEXT_PUBLIC_SUPABASE_URL_set: hasSupabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_set: hasSupabaseAnon,
      NODE_ENV: process.env.NODE_ENV,
    },
    prisma: {
      status: prismaStatus,
      productCount: prismaProductCount,
      error: prismaError,
    },
    rawPg: {
      status: rawStatus,
      productCount: rawProductCount,
      error: rawError,
      tablesInPublicSchema: rawTableList,
    },
    connectionUrlMasked: maskedUrl,
    diagnosis: getDiagnosis(
      hasDbUrl,
      hasDirectUrl,
      prismaStatus,
      prismaError,
      rawStatus,
      rawError,
      rawProductCount,
      rawTableList
    ),
  });
}

function getDiagnosis(
  hasDb: boolean,
  hasDirect: boolean,
  prismaStatus: string,
  prismaError: string,
  rawStatus: string,
  rawError: string,
  rawCount: number,
  tables: string[]
): string[] {
  const out: string[] = [];
  if (!hasDb) out.push("❌ DATABASE_URL is not set on Vercel.");
  if (!hasDirect) out.push("❌ DIRECT_URL is not set on Vercel.");

  if (rawStatus === "error") {
    if (rawError.includes("ECONNREFUSED") || rawError.includes("timeout")) {
      out.push("❌ Vercel can't reach Supabase Postgres. The Supabase project may be paused (free tier auto-pauses after 7 days of inactivity). Restore it from Supabase Dashboard → Settings → General.");
    } else if (rawError.includes("password authentication failed")) {
      out.push("❌ Database password is wrong. Make sure to URL-encode special characters: @ → %40, # → %23, etc.");
    } else {
      out.push(`❌ Raw pg connection error: ${rawError}`);
    }
  } else if (rawStatus === "ok" && prismaStatus === "empty") {
    out.push("⚠ Raw pg sees " + rawCount + " products but Prisma sees 0. This is a Prisma client/schema issue. Try running `npx prisma generate` and redeploying.");
  } else if (rawStatus === "ok" && prismaStatus === "ok") {
    out.push("✅ Everything looks good — both raw pg and Prisma can see data.");
  } else if (rawStatus === "empty") {
    out.push("⚠ Database is connected but has no products. Run scripts/seed-supabase.ts to insert sample data.");
  }

  if (tables.length > 0 && !tables.includes("products")) {
    out.push("❌ 'products' table not found in public schema. Tables present: " + tables.join(", "));
  }
  if (tables.length === 0 && rawStatus === "ok") {
    out.push("⚠ No tables found in public schema. Run scripts/setup-supabase.sql in Supabase SQL Editor.");
  }

  return out;
}
