import { PrismaClient } from ".prisma/client";
import type { PoolConfig } from "@neondatabase/serverless";
import type { PrismaNeon as PrismaNeonType } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const isNeon = databaseUrl.includes("neon.tech");

  if (isNeon) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaNeon } = require("@prisma/adapter-neon") as { PrismaNeon: typeof PrismaNeonType };
    const neonConfig: PoolConfig = {
      connectionString: databaseUrl,
      connectionTimeoutMillis: 10000,
      max: 10,
    };
    const adapter = new PrismaNeon(neonConfig);
    return new PrismaClient({ adapter });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as PrismaClient;
