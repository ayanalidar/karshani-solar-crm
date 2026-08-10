import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Use DIRECT_URL for the adapter (no pgbouncer), fallback to DATABASE_URL
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://localhost:5432/postgres";
const adapter = new PrismaPg({ connectionString });

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
