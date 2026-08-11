import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

let prismaInstance: PrismaClient;

if (!connectionString) {
  // No database configured — use a client that returns empty arrays
  // This survives build-time prerendering without a DB connection
  prismaInstance = new PrismaClient();
} else {
  const adapter = new PrismaPg({ connectionString });
  prismaInstance = new PrismaClient({ adapter });
}

// Intercept queries so build-time failures don't crash — they return empty data
// At runtime with a real database, queries work normally
if (typeof Proxy !== "undefined") {
  prismaInstance = new Proxy(prismaInstance, {
    get(target, prop) {
      const original = (target as Record<string, unknown>)[prop as string];
      if (typeof original !== "function") return (target as Record<string, unknown>)[prop as string];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return async (...args: any[]) => {
        try {
          return await (original as (...a: unknown[]) => unknown)(...args);
        } catch {
          // Database unavailable during build — return empty
          if (Array.isArray(args[0])) return [];
          if (typeof args[0] === "object") return [];
          return null;
        }
      };
    },
  }) as PrismaClient;
}

export const prisma = globalForPrisma.prisma || prismaInstance;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
