#!/usr/bin/env node
/**
 * Applies pending Prisma migrations during a Vercel PRODUCTION build.
 *
 * Why this exists: `git push` ships code, not database structure. Migration
 * files in prisma/migrations/ are inert until something runs them against the
 * live database. Without this step, adding a column locally and deploying
 * leaves production querying a column that was never created there — which is
 * how candidate_profiles ended up missing from TiDB entirely (P2021).
 *
 * Guards, in order:
 *   1. Preview/development builds never touch the production database. Vercel
 *      runs the same build command for every branch, so without this check a
 *      throwaway branch could migrate live data.
 *   2. A production build with no DATABASE_URL fails loudly here rather than
 *      deploying successfully and 500ing at runtime. Vercel keeps the previous
 *      deployment serving traffic, so a failure here is safe.
 *
 * DATABASE_URL must be set in Vercel scoped to the Production environment, and
 * must point at TiDB with TLS (`?sslaccept=strict`) — TiDB rejects insecure
 * transport. Note it is read by prisma.config.ts, which is why DB_PROD_* alone
 * is not enough for the migrate CLI.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const env = process.env.VERCEL_ENV ?? "(unset)";

if (env !== "production") {
  console.log(`[migrate-prod] VERCEL_ENV=${env} — skipping migrations (production only).`);
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error(
    [
      "",
      "[migrate-prod] ERROR: DATABASE_URL is not set for this production build.",
      "",
      "  Migrations cannot be applied, and deploying without them would leave the",
      "  live site querying tables/columns that do not exist in TiDB.",
      "",
      "  Fix: Vercel → Settings → Environment Variables → add DATABASE_URL,",
      "  scoped to Production only, pointing at TiDB with ?sslaccept=strict",
      "",
    ].join("\n")
  );
  process.exit(1);
}

console.log("[migrate-prod] Production build — applying pending migrations to TiDB…");

// Resolve the local CLI rather than trusting PATH: bare `prisma` only works
// when npm has injected node_modules/.bin, which is true for `npm run` but not
// for a directly-spawned node process. Fall back to npx if the layout differs.
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localBin = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma"
);

const [command, args] = existsSync(localBin)
  ? [localBin, ["migrate", "deploy"]]
  : ["npx", ["--no", "prisma", "migrate", "deploy"]];

const result = spawnSync(command, args, {
  stdio: "inherit",
  shell: true,
  cwd: projectRoot,
});

if (result.status !== 0) {
  console.error("[migrate-prod] `prisma migrate deploy` failed — aborting the build.");
}

process.exit(result.status ?? 1);
