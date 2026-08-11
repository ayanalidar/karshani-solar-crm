import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

let baseClient: PrismaClient;
if (!connectionString) {
  baseClient = new PrismaClient();
} else {
  const adapter = new PrismaPg({ connectionString });
  baseClient = new PrismaClient({ adapter });
}

// Recursively wrap all model delegates so nested calls (prisma.product.findMany)
// survive build-time DB failures by returning empty arrays instead of crashing
function safeWrap<T extends object>(obj: T): T {
  return new Proxy(obj, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      // If the value is an async function (like findMany, create, upsert), wrap it
      if (typeof value === "function" && value.constructor.name === "AsyncFunction") {
        return async (...args: unknown[]) => {
          try {
            return await (value as (...a: unknown[]) => unknown).apply(target, args);
          } catch {
            // DB unavailable — return empty/fallback
            if (Array.isArray(args[0])) return [];
            if (args.length > 0 && typeof args[0] === "object") return [];
            return null;
          }
        };
      }
      // If the value is an object (model delegate), wrap it recursively
      if (value !== null && typeof value === "object") {
        return safeWrap(value as object);
      }
      return value;
    },
  }) as T;
}

export const prisma = globalForPrisma.prisma || safeWrap(baseClient);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
