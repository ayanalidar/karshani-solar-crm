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

  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

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
  if (connectionString) {
    let pool: Pool | null = null;
    try {
      pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10000 });
      const res = await pool.query("SELECT COUNT(*)::int as cnt FROM products");
      rawProductCount = res.rows[0]?.cnt || 0;
      rawStatus = rawProductCount > 0 ? "ok" : "empty";

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

  // Mask connection string (show host:port + path, hide password)
  let maskedUrl = "";
  let connectionHost = "";
  try {
    const u = new URL(connectionString);
    maskedUrl = `${u.protocol}//***:***@${u.host}${u.pathname}`;
    connectionHost = u.host;
  } catch {
    maskedUrl = connectionString ? "(invalid URL format)" : "(not set)";
  }

  // Detect IPv6-only hosts (the most common cause of ENOTFOUND on Vercel)
  const isDirectSupabaseUrl = connectionHost.startsWith("db.") && connectionHost.endsWith(".supabase.co");
  const isPoolerUrl = connectionHost.includes(".pooler.supabase.com");

  // Extract project ref from connection string for suggesting pooler URL
  let projectRef = "";
  const refMatch = connectionHost.match(/([a-z0-9]+)\.supabase\.co/);
  if (refMatch) projectRef = refMatch[1];

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
    connection: {
      urlMasked: maskedUrl,
      host: connectionHost,
      isDirectSupabaseUrl,
      isPoolerUrl,
      projectRef,
    },
    diagnosis: getDiagnosis(
      hasDbUrl,
      hasDirectUrl,
      prismaStatus,
      prismaError,
      rawStatus,
      rawError,
      rawProductCount,
      rawTableList,
      isDirectSupabaseUrl,
      projectRef
    ),
    fix: getFixInstructions(isDirectSupabaseUrl, projectRef, rawError),
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
  tables: string[],
  isDirectSupabaseUrl: boolean,
  projectRef: string
): string[] {
  const out: string[] = [];
  if (!hasDb) out.push("❌ DATABASE_URL is not set on Vercel.");
  if (!hasDirect) out.push("❌ DIRECT_URL is not set on Vercel.");

  if (rawError.includes("ENOTFOUND") && isDirectSupabaseUrl) {
    out.push(`❌ DNS lookup failed for ${projectRef ? "db." + projectRef + ".supabase.co" : "Supabase direct URL"}. This is the IPv6-only issue — Vercel serverless can't resolve IPv6-only hosts. Switch to the Supabase POOLER URL (IPv4). See 'fix' section for exact value to paste on Vercel.`);
  } else if (rawStatus === "error") {
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

function getFixInstructions(isDirectSupabaseUrl: boolean, projectRef: string, rawError: string): string[] {
  const steps: string[] = [];

  if (rawError.includes("ENOTFOUND") && isDirectSupabaseUrl && projectRef) {
    steps.push("ROOT CAUSE: Supabase's direct DB hostname (db.xxx.supabase.co) is IPv6-only, but Vercel serverless functions can't make outbound IPv6 connections. You MUST use the Supabase POOLER URL (IPv4) instead.");
    steps.push("");
    steps.push("HOW TO FIX (3 minutes):");
    steps.push("1. Open Supabase Dashboard → your project → Settings → Database → Connection String");
    steps.push("2. Switch the 'Connection mode' to 'Transaction' (or 'Session')");
    steps.push("3. Copy the URL — it looks like:");
    steps.push(`   postgresql://postgres.${projectRef}:YOUR-PASSWORD@aws-0.REGION.pooler.supabase.com:6543/postgres`);
    steps.push("4. On Vercel → your project → Settings → Environment Variables");
    steps.push("5. Update DATABASE_URL and DIRECT_URL to the new pooler URL");
    steps.push("   (Make sure @ in the password is URL-encoded as %40)");
    steps.push("6. Click Save, then Deployments → Redeploy the latest build");
    steps.push("");
    steps.push("Note: the POOLER username is 'postgres.PROJECT_REF' (with a dot, not just 'postgres'). For your project, that's 'postgres." + projectRef + "'.");
    steps.push("");
    steps.push("Note: For Prisma + transaction pooler, add ?pgbouncer=true&connection_limit=1 to the URL.");
  } else if (rawError.includes("ENOTFOUND")) {
    steps.push("DNS lookup failed. Check that the DATABASE_URL host is spelled correctly and the Supabase project is not paused.");
  }

  return steps;
}
