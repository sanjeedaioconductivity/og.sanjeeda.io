import mysql from "mysql2/promise";

// ─── Environment-aware DB bridge ────────────────────────────────────────────
// LOCAL / DEV  → writes to your LOCAL MySQL (127.0.0.1) via DB_*      vars.
// PRODUCTION   → writes to your cloud  MySQL            via DB_PROD_* vars.
//
// The same code automatically picks the right database, so test signups stay
// in your local DB and only real, live signups reach the production DB.
//
// The "firewall" check below REFUSES to start a production build that points at
// a local/empty host — this makes it impossible for the live site to silently
// write real users into a local (or missing) database.
// ─────────────────────────────────────────────────────────────────────────────

const isProduction =
  process.env.VERCEL_ENV === "production" ||
  process.env.APP_ENV === "production" ||
  (process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV !== "preview");

// Managed cloud MySQL (TiDB Cloud, Aiven, PlanetScale, etc.) require TLS.
// Enabled for production by default; set DB_PROD_SSL=false to opt out.
const useProdSsl = process.env.DB_PROD_SSL !== "false";

const config = isProduction
  ? {
      host: process.env.DB_PROD_HOST,
      user: process.env.DB_PROD_USER,
      password: process.env.DB_PROD_PASS,
      database: process.env.DB_PROD_NAME,
      port: Number(process.env.DB_PROD_PORT) || 3306,
      ...(useProdSsl
        ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } }
        : {}),
    }
  : {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT) || 3306,
    };

// FIREWALL: production must never use a local or empty DB host.
const isLocalHost = /^(127\.0\.0\.1|localhost|::1)$/i.test(config.host ?? "");
if (isProduction && (isLocalHost || !config.host)) {
  throw new Error(
    "[DB BRIDGE] Production is not allowed to use a local/empty DB host " +
      `(got: "${config.host ?? ""}"). Set DB_PROD_HOST / DB_PROD_USER / ` +
      "DB_PROD_PASS / DB_PROD_NAME / DB_PROD_PORT (Railway) in your production " +
      "environment (e.g. the Vercel dashboard)."
  );
}

// Log which database is in use (host only — never the password).
console.log(
  `[DB BRIDGE] ${isProduction ? "PRODUCTION" : "LOCAL/DEV"} → ` +
    `${config.host}:${config.port}/${config.database}`
);

export const db = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
