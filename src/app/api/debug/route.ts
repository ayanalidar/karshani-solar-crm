import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Diagnostics endpoint — returns env var status + DB connection test.
// Safe to expose (no secrets leaked, only boolean + error messages).
export async function GET() {
  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  const hasDirectUrl = Boolean(process.env.DIRECT_URL);
  const hasAuthSecret = Boolean(process.env.AUTH_SECRET);
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasSupabaseAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // Test DB connection by counting a small table
  let dbStatus: "ok" | "error" | "empty" = "empty";
  let dbError = "";
  let productCount = 0;
  try {
    const products = await prisma.product.findMany({ select: { id: true } });
    productCount = Array.isArray(products) ? products.length : 0;
    dbStatus = productCount > 0 ? "ok" : "empty";
  } catch (err: any) {
    dbStatus = "error";
    dbError = err?.message || String(err);
  }

  // Show masked connection string for debugging (host only, no password)
  const dbUrl = process.env.DATABASE_URL || "";
  let maskedUrl = "";
  try {
    const u = new URL(dbUrl);
    maskedUrl = `${u.protocol}//***:***@${u.host}${u.pathname}`;
  } catch {
    maskedUrl = dbUrl ? "(invalid URL format)" : "(not set)";
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
    database: {
      status: dbStatus,
      productCount,
      error: dbError,
      connectionUrlMasked: maskedUrl,
    },
    diagnosis: getDiagnosis(hasDbUrl, hasDirectUrl, dbStatus, dbError),
  });
}

function getDiagnosis(hasDb: boolean, hasDirect: boolean, status: string, error: string): string[] {
  const out: string[] = [];
  if (!hasDb) out.push("❌ DATABASE_URL is not set on Vercel. Add it in Settings → Environment Variables.");
  if (!hasDirect) out.push("❌ DIRECT_URL is not set on Vercel. Add it in Settings → Environment Variables.");
  if (hasDb && status === "error") {
    if (error.includes("ECONNREFUSED") || error.includes("Can't reach database server")) {
      out.push("❌ Vercel can't reach Supabase Postgres. The Supabase project may be paused (free tier auto-pauses after 7 days of inactivity). Restore it from the Supabase Dashboard → Settings → General.");
    } else if (error.includes("password authentication failed")) {
      out.push("❌ Database password is wrong. Make sure to URL-encode special characters: @ → %40, # → %23, etc.");
    } else if (error.includes("relation") && error.includes("does not exist")) {
      out.push("❌ Some tables don't exist on Supabase. Run scripts/setup-supabase.sql + scripts/create-invoice-items.sql in Supabase SQL Editor.");
    } else {
      out.push(`❌ DB connection error: ${error}`);
    }
  }
  if (hasDb && status === "empty" && !error) {
    out.push("⚠ DB connected but no products found. Run scripts/seed-supabase.ts or scripts/seed-more-data.ts to insert sample data.");
  }
  if (status === "ok") {
    out.push("✅ Everything looks good — DB is connected and has data.");
  }
  return out;
}
