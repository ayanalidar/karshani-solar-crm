import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Only create a new Prisma client + Pool if one doesn't already exist on
// globalThis. This prevents creating multiple pools on Vercel serverless
// warm starts, which would exhaust the Supabase connection pool.
if (!globalForPrisma.prisma) {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  // Supabase Session pooler allows max 15 concurrent connections.
  // We limit the pg Pool to max 3 connections per serverless instance.
  const pool = new Pool({
    connectionString: connectionString || "postgresql://localhost:5432/postgres",
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  const adapter = new PrismaPg(pool);
  const baseClient = new PrismaClient({ adapter });
  globalForPrisma.prisma = safeWrap(baseClient);
}

export const prisma = globalForPrisma.prisma!;

// Recursively wrap all model delegates so nested calls survive
// build-time DB failures by returning empty arrays instead of crashing.
function isAsync(fn: unknown): boolean {
  if (typeof fn !== "function") return false;
  return (fn as any)[Symbol.toStringTag] === "AsyncFunction" || fn.constructor?.name === "AsyncFunction";
}

function safeWrap<T extends object>(obj: T): T {
  return new Proxy(obj, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        const isAsyncFn = isAsync(value);
        const wrapped = (...args: unknown[]) => {
          try {
            const result = (value as (...a: unknown[]) => unknown).apply(target, args);
            if (result && typeof (result as Promise<unknown>).then === "function") {
              return (result as Promise<unknown>).catch((err) => {
                console.error("[prisma] query failed:", String(prop), err instanceof Error ? err.message : err);
                return safeFallback(String(prop));
              });
            }
            return result;
          } catch (err) {
            console.error("[prisma] sync call failed:", String(prop), err instanceof Error ? err.message : err);
            return safeFallback(String(prop));
          }
        };
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

function safeFallback(methodName: string): unknown {
  if (methodName === "findMany" || methodName === "count" || methodName === "groupBy") return [];
  if (methodName === "findUnique" || methodName === "findFirst" || methodName === "create" || methodName === "update" || methodName === "delete" || methodName === "upsert") return null;
  if (methodName === "aggregate") return { _count: {} };
  return null;
}
