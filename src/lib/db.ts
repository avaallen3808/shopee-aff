import { type PoolConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from ".prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const neonConfig: PoolConfig = {
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
    max: 10,
  };

  const adapter = new PrismaNeon(neonConfig);

  return new PrismaClient({ adapter });
}

/**
 * Lazy Prisma client — only instantiated on first access, not at import time.
 * This allows the module to be imported during build without DATABASE_URL.
 */
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Proxy that defers instantiation until a property is accessed
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as PrismaClient;
