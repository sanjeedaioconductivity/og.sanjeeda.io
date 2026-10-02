import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: InstanceType<typeof PrismaClient>;
};

/**
 * Everything below used to run at module scope, and that broke `next build`.
 *
 * The build's "Collecting page data" step imports every route module, so a
 * top-level `throw` here runs on a machine that has no database — and on a
 * preview deployment, no DB_* variables at all. The failure was
 *   Error: Database host is missing.
 *   Failed to collect page data for /api/offerguide/candidate-profile/consent
 * i.e. the build died before a single request could exist.
 *
 * The checks are unchanged; they just moved behind first use. A build now needs
 * no credentials, and a genuinely misconfigured deployment still fails loudly
 * with the same message — at request time, where it is actionable.
 */

const isProduction =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";

// TLS is required by the TiDB Cloud public endpoint, but a local MySQL/MariaDB
// only offers a self-signed certificate — forcing `ssl: true` there fails the
// handshake with SELF_SIGNED_CERT_IN_CHAIN, so the pool never gets a single
// connection and every query dies with a "pool timeout" (P2039) after 10s.
// Default to TLS for remote hosts, off for loopback, and let DB_SSL override.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function resolveSsl(host: string): boolean {
  const override = process.env.DB_SSL?.trim().toLowerCase();
  if (override === "true" || override === "1") return true;
  if (override === "false" || override === "0") return false;
  return !LOCAL_HOSTS.has(host.toLowerCase());
}

function createClient(): InstanceType<typeof PrismaClient> {
  const host = isProduction ? process.env.DB_PROD_HOST : process.env.DB_HOST;

  const port = Number(
    isProduction ? process.env.DB_PROD_PORT : process.env.DB_PORT
  );

  const user = isProduction ? process.env.DB_PROD_USER : process.env.DB_USER;

  const password = isProduction
    ? process.env.DB_PROD_PASS
    : process.env.DB_PASS;

  const database = isProduction
    ? process.env.DB_PROD_NAME
    : process.env.DB_NAME;

  if (!host) {
    throw new Error("Database host is missing.");
  }

  if (!port || Number.isNaN(port)) {
    throw new Error("Database port is missing or invalid.");
  }

  if (!user) {
    throw new Error("Database user is missing.");
  }

  if (!password) {
    throw new Error("Database password is missing.");
  }

  if (!database) {
    throw new Error("Database name is missing.");
  }

  const adapter = new PrismaMariaDb({
    host,
    port,
    user,
    password,
    database,

    ssl: resolveSsl(host),

    // Keep serverless connection usage small.
    connectionLimit: 3,

    // Fail clearly instead of hanging indefinitely.
    connectTimeout: 5000,
    acquireTimeout: 10000,
  });

  return new PrismaClient({ adapter });
}

let client: InstanceType<typeof PrismaClient> | undefined;

function getClient(): InstanceType<typeof PrismaClient> {
  if (client) return client;

  client = globalForPrisma.prisma ?? createClient();

  // Same as before: reuse across hot reloads in dev so watch mode does not open
  // a new pool on every edit. Production deliberately does not cache globally.
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

/**
 * Proxy rather than a plain export, so the 16 call sites keep using
 * `prisma.model.method()` unchanged while construction stays deferred to the
 * first property access.
 */
export const prisma = new Proxy({} as InstanceType<typeof PrismaClient>, {
  get(_target, property, receiver) {
    const value = Reflect.get(getClient(), property, receiver);
    return typeof value === "function" ? value.bind(getClient()) : value;
  },
  has(_target, property) {
    return property in getClient();
  },
  ownKeys() {
    return Reflect.ownKeys(getClient());
  },
  getOwnPropertyDescriptor(_target, property) {
    return Reflect.getOwnPropertyDescriptor(getClient(), property);
  },
});
