import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
const adapter = new PrismaPg({ connectionString: connectionString || "postgresql://localhost:5432/postgres" });
const baseClient = new PrismaClient({ adapter });

// Recursively wrap all model delegates so nested calls survive
// build-time DB failures by returning empty arrays instead of crashing
function safeWrap<T extends object>(obj: T): T {
  return new Proxy(obj, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function" && value.constructor.name === "AsyncFunction") {
        return async (...args: unknown[]) => {
          try {
            return await (value as (...a: unknown[]) => unknown).apply(target, args);
          } catch {
            if (Array.isArray(args[0])) return [];
            if (args.length > 0 && typeof args[0] === "object") return [];
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
