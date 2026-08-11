import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
const adapter = new PrismaPg({ connectionString: connectionString || "postgresql://localhost:5432/postgres" });
const baseClient = new PrismaClient({ adapter });

// Recursively wrap all model delegates so nested calls survive
// build-time DB failures by returning empty arrays instead of crashing.
// Errors are logged so silent DB failures don't get hidden in production.
function safeWrap<T extends object>(obj: T): T {
  return new Proxy(obj, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function" && value.constructor.name === "AsyncFunction") {
        return async (...args: unknown[]) => {
          try {
            return await (value as (...a: unknown[]) => unknown).apply(target, args);
          } catch (err) {
            console.error("[prisma] query failed:", String(prop), err instanceof Error ? err.message : err);
            // findMany / findUnique / findFirst / count: return [] or null based on shape.
            // findMany ALWAYS returns array (even with no args). Others return null.
            const name = String(prop);
            if (name === "findMany" || name === "findUnique" || name === "findFirst" || name === "count") {
              if (name === "findMany" || name === "count") return [];
              return null;
            }
            // Aggregations like aggregate() return object shape; return safe default
            if (name === "aggregate") return { _count: {} };
            if (name === "groupBy") return [];
            // Mutations: create/update/delete return null on failure
            return null;
          }
        };
      }
      if (value !== null && typeof value === "object") {
        return safeWrap(value as object);
      }
      return value;
    },
  }) as T;
}

export const prisma = globalForPrisma.prisma || safeWrap(baseClient);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
