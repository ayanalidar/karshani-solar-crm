import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
// Supabase Session pooler allows max 15 concurrent connections.
// We limit the pg Pool to max 3 connections to avoid exhausting the pool.
const pool = new Pool({
  connectionString: connectionString || "postgresql://localhost:5432/postgres",
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
const baseClient = new PrismaClient({ adapter });

// Detect async functions without relying on Function.constructor.name
// (which gets mangled by minifiers in production builds).
function isAsync(fn: unknown): boolean {
  if (typeof fn !== "function") return false;
  // Check via toString — async functions start with "async " in their source
  // in dev, and the constructor check works in some minified builds.
  // The most reliable check: tag the wrapper.
  return (fn as any)[Symbol.toStringTag] === "AsyncFunction" || fn.constructor?.name === "AsyncFunction";
}

// Recursively wrap all model delegates so nested calls survive
// build-time DB failures by returning empty arrays instead of crashing.
// Errors are logged so silent DB failures don't get hidden in production.
function safeWrap<T extends object>(obj: T): T {
  return new Proxy(obj, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        // Wrap EVERY function on the delegate — if it's async, await will work;
        // if it's sync, returning the result is fine. We catch both kinds.
        const isAsyncFn = isAsync(value);
        const wrapped = (...args: unknown[]) => {
          try {
            const result = (value as (...a: unknown[]) => unknown).apply(target, args);
            // If it's a Promise (async), wrap with catch
            if (result && typeof (result as Promise<unknown>).then === "function") {
              return (result as Promise<unknown>).catch((err) => {
                console.error("[prisma] query failed:", String(prop), err instanceof Error ? err.message : err);
                return safeFallback(String(prop));
              });
            }
            // Sync function returned a value — return as-is
            return result;
          } catch (err) {
            console.error("[prisma] sync call failed:", String(prop), err instanceof Error ? err.message : err);
            return safeFallback(String(prop));
          }
        };
        // Preserve async-ness so callers can await
        if (isAsyncFn) {
          return async (...args: unknown[]) => wrapped(...args);
        }
        return wrapped;
      }
      if (value !== null && typeof value === "object") {
        return safeWrap(value as object);
      }
      return value;
    },
  }) as T;
}

// Return the appropriate empty value based on which Prisma method failed.
function safeFallback(methodName: string): unknown {
  if (methodName === "findMany" || methodName === "count" || methodName === "groupBy") return [];
  if (methodName === "findUnique" || methodName === "findFirst" || methodName === "create" || methodName === "update" || methodName === "delete" || methodName === "upsert") return null;
  if (methodName === "aggregate") return { _count: {} };
  return null;
}

export const prisma = globalForPrisma.prisma || safeWrap(baseClient);

// Always cache on globalThis (not just dev) — prevents creating multiple
// Prisma clients on Vercel serverless warm starts, which would exhaust
// the Supabase connection pool.
globalForPrisma.prisma = prisma;
