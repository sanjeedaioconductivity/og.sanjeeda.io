#!/usr/bin/env node
/**
 * Sprint 9, Stories 9.1.2 and 9.1.3 — the portal's role rollout.
 *
 * Adds `sanjeedausers.role`, baselines every existing account to 'user', and
 * promotes a supplied list of accounts to 'admin'. One script, because those
 * three things have to be one auditable operation: a column that exists but has
 * not been baselined, or a baseline with no admin, is a half-migrated portal.
 *
 * WHY NOT A PRISMA MIGRATION. `sanjeedausers` is declared external in
 * prisma.config.ts and must stay that way. The read-only UserInfo model
 * deliberately models only the columns permission checks need, so if the table
 * were taken off the external list, `prisma migrate diff` proposes:
 *
 *     ALTER TABLE `sanjeedausers` DROP COLUMN `google_id`, DROP COLUMN `password`,
 *       DROP COLUMN `reset_code`, DROP COLUMN `reset_code_expiry`, …
 *
 * — the portal's credentials. That was verified, not assumed. This is also what
 * the handoff asks for: "a plain SQL migration, following the precedent set by
 * the Sprint 1 bcrypt migration".
 *
 * IDEMPOTENT. Every step checks before it writes, so running twice produces the
 * same result and a partial run can simply be re-run.
 *
 * REVERSIBLE. `--rollback` drops the column. Roles are not stored anywhere else,
 * so that restores the exact pre-migration state.
 *
 * NO SELF-SERVICE PROMOTION. There is no admin UI and no API endpoint that
 * changes a role, by design (Sprint 9 §6). This script is the only way in, and
 * running it is a deliberate operational act.
 *
 * USAGE
 *   node scripts/migrate-roles.mjs --list                   WHO ARE THE ADMINS?
 *   node scripts/migrate-roles.mjs --emails=a@x.com         add an admin
 *   node scripts/migrate-roles.mjs --demote=a@x.com         remove an admin
 *   node scripts/migrate-roles.mjs --check                  inspect, change nothing
 *   node scripts/migrate-roles.mjs                          add column + baseline
 *   node scripts/migrate-roles.mjs --rollback               drop the column
 *
 * Add --prod to any of the above to target the production database (DB_PROD_*)
 * instead of local (DB_*). Add --check to preview a promotion or demotion.
 *
 * `--list` is the ONLY place to see who has admin access. There is no page for
 * it and no API that exposes it, deliberately: roles are operational state, not
 * application data.
 *
 * The admin list may also come from OFFERGUIDE_ADMIN_EMAILS (comma-separated).
 * It is never hardcoded here and never committed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TABLE = "sanjeedausers";
const COLUMN = "role";
const DEFAULT_ROLE = "user";
const ADMIN_ROLE = "admin";

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

const CHECK_ONLY = has("--check");
const ROLLBACK = has("--rollback");
const PROD = has("--prod");
const LIST = has("--list");
const FORCE = has("--force");

/* ------------------------------------------------------------------ env */

// .env.local is the project's own convention (Next reads it); node does not.
for (const file of [".env.local", ".env"]) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) continue;
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const conf = PROD
  ? {
      host: process.env.DB_PROD_HOST,
      port: Number(process.env.DB_PROD_PORT || 4000),
      user: process.env.DB_PROD_USER,
      password: process.env.DB_PROD_PASS,
      database: process.env.DB_PROD_NAME,
      // TiDB Cloud's public endpoint rejects insecure transport.
      ssl: { minVersion: "TLSv1.2" },
    }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    };

for (const [key, value] of Object.entries({
  host: conf.host,
  user: conf.user,
  database: conf.database,
})) {
  if (!value) {
    console.error(
      `[migrate-roles] ERROR: database ${key} is not set (${PROD ? "DB_PROD_*" : "DB_*"}).`
    );
    process.exit(1);
  }
}

const adminEmails = (valueOf("emails") ?? process.env.OFFERGUIDE_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const demoteEmails = (valueOf("demote") ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/* --------------------------------------------------------------- helpers */

async function columns(conn) {
  const [rows] = await conn.query(`SHOW COLUMNS FROM \`${TABLE}\``);
  return rows;
}

function log(...parts) {
  console.log("[migrate-roles]", ...parts);
}

/**
 * The column schema.prisma expects `UserInfo`'s primary key to be, read from the
 * schema rather than hardcoded.
 *
 * Hardcoding it is what let this drift in the first place: the script asserted
 * `user_id` (what local had), production turned out to use `id`, and the check
 * would have kept warning about the wrong column after the schema was corrected.
 * Reading the real @map means this comparison can never go stale.
 */
function schemaPrimaryKey() {
  try {
    const schema = fs.readFileSync(path.join(ROOT, "prisma", "schema.prisma"), "utf8");
    const model = schema.match(/model\s+UserInfo\s*\{([\s\S]*?)\n\}/);
    if (!model) return null;
    const idLine = model[1].split("\n").find((l) => /@id\b/.test(l));
    return idLine?.match(/@map\("([^"]+)"\)/)?.[1] ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ main */

/**
 * Connecting is its own step with its own error handling, because the failures
 * here are environmental rather than logical and each one has a different fix.
 * Left unhandled, mysql2 throws before the try block below and Node prints a
 * raw stack trace — which tells an operator running this against production at
 * deploy time approximately nothing.
 */
async function connect() {
  try {
    return await mysql.createConnection(conf);
  } catch (error) {
    const target = `${conf.host}:${conf.port}`;
    console.error(`[migrate-roles] Could not connect to ${PROD ? "PRODUCTION" : "local"} database at ${target}.`);

    switch (error.code) {
      case "EAI_AGAIN":
        console.error(`[migrate-roles] DNS lookup for ${conf.host} failed temporarily.`);
        console.error(`[migrate-roles] This is usually a transient network blip — WAIT A MOMENT AND RUN IT AGAIN.`);
        console.error(`[migrate-roles] If it keeps failing, check your connection, VPN, or DNS.`);
        break;
      case "ENOTFOUND":
        console.error(`[migrate-roles] The host ${conf.host} does not resolve at all.`);
        console.error(`[migrate-roles] Check DB_${PROD ? "PROD_" : ""}HOST in .env.local.`);
        break;
      case "ETIMEDOUT":
      case "ECONNREFUSED":
        console.error(`[migrate-roles] Reached the network but nothing accepted the connection.`);
        console.error(
          PROD
            ? `[migrate-roles] TiDB Cloud restricts by IP — check your current address is allowed.`
            : `[migrate-roles] Is your local MySQL running?`
        );
        break;
      case "ER_ACCESS_DENIED_ERROR":
        console.error(`[migrate-roles] Credentials rejected. Check DB_${PROD ? "PROD_" : ""}USER / _PASS.`);
        break;
      case "ER_BAD_DB_ERROR":
        console.error(`[migrate-roles] Database "${conf.database}" does not exist on that host.`);
        break;
      default:
        console.error(`[migrate-roles] ${error.code ?? "error"}: ${error.message}`);
    }

    console.error(`[migrate-roles] Nothing was changed.`);
    process.exit(1);
  }
}

const conn = await connect();
let exitCode = 0;

try {
  log(`target: ${PROD ? "PRODUCTION" : "local"} — ${conf.database} at ${conf.host}:${conf.port}`);

  const cols = await columns(conn);
  const names = cols.map((c) => c.Field);
  const primaryKey = cols.find((c) => c.Key === "PRI")?.Field ?? "(none)";
  const roleColumn = cols.find((c) => c.Field === COLUMN);

  // Local and production genuinely diverged here — local had `user_id`, TiDB has
  // `id` — and a mismatch is not cosmetic: Prisma would select a column that does
  // not exist, every role read would throw, and every admin would be denied.
  const expectedKey = schemaPrimaryKey();
  log(`primary key: ${primaryKey}${expectedKey ? ` (schema.prisma expects \`${expectedKey}\`)` : ""}`);
  if (expectedKey && primaryKey !== expectedKey) {
    console.warn(
      `[migrate-roles] WARNING: schema.prisma maps UserInfo's id to \`${expectedKey}\`, but this database's primary key is \`${primaryKey}\`.`
    );
    console.warn(
      `[migrate-roles] Prisma role reads WILL FAIL here, which denies every admin. Align the column or the @map before deploying.`
    );
  }
  log(`columns: ${names.join(", ")}`);

  const [[{ total }]] = await conn.query(`SELECT COUNT(*) AS total FROM \`${TABLE}\``);
  log(`accounts: ${total}`);

  if (roleColumn) {
    const [byRole] = await conn.query(
      `SELECT \`${COLUMN}\` AS role, COUNT(*) AS n FROM \`${TABLE}\` GROUP BY \`${COLUMN}\``
    );
    log(`current roles: ${byRole.map((r) => `${r.role || "(empty)"}=${r.n}`).join(", ") || "none"}`);
  } else {
    log(`column \`${COLUMN}\`: not present`);
  }

  /* -------------------------------------------------------------- list */

  // `--list` is the answer to "who are the admins?". There is no page that
  // shows this and deliberately no API that exposes it: roles are operational
  // state, not application data. This is the only place to look.
  if (LIST) {
    if (!roleColumn) {
      log(`column \`${COLUMN}\` does not exist yet — run this script with no flags first.`);
      process.exit(0);
    }

    const [rows] = await conn.query(
      `SELECT \`${primaryKey}\` AS id, name, email, \`${COLUMN}\` AS role
         FROM \`${TABLE}\`
        ORDER BY (\`${COLUMN}\` = '${ADMIN_ROLE}') DESC, \`${primaryKey}\``
    );

    const admins = rows.filter((r) => r.role === ADMIN_ROLE);

    console.log("");
    console.log(`  ADMINS (${admins.length})`);
    console.log("  " + "-".repeat(58));
    if (admins.length === 0) {
      console.log("  (none — /admin/config/* is unreachable by anyone)");
    } else {
      for (const a of admins) console.log(`  #${String(a.id).padEnd(5)} ${a.email}`);
    }

    const users = rows.filter((r) => r.role !== ADMIN_ROLE);
    console.log("");
    console.log(`  OTHER ACCOUNTS (${users.length})`);
    console.log("  " + "-".repeat(58));
    for (const u of users) {
      console.log(`  #${String(u.id).padEnd(5)} ${String(u.email).padEnd(38)} ${u.role}`);
    }
    console.log("");
    log(`total ${rows.length} account(s): ${admins.length} admin, ${users.length} user`);
    process.exit(0);
  }

  /* ------------------------------------------------------------ demote */

  // Removing an admin. Separate flag from --emails on purpose: promoting and
  // demoting in one command makes it too easy to mistype one address and both
  // grant and revoke the wrong access in a single run.
  if (demoteEmails.length > 0) {
    if (!roleColumn) {
      log(`column \`${COLUMN}\` does not exist yet — nothing to demote.`);
      process.exit(0);
    }

    const [currentAdmins] = await conn.query(
      `SELECT email FROM \`${TABLE}\` WHERE \`${COLUMN}\` = ?`,
      [ADMIN_ROLE]
    );
    const adminSet = new Set(currentAdmins.map((r) => String(r.email).toLowerCase()));
    const actuallyAdmin = demoteEmails.filter((e) => adminSet.has(e));

    // Locking everyone out of the admin API is recoverable only by running this
    // script again — which is fine on a laptop and a genuine incident on
    // production at 2am. Refuse by default; --force is the deliberate override.
    if (actuallyAdmin.length >= adminSet.size && adminSet.size > 0 && !FORCE) {
      console.error(
        `[migrate-roles] REFUSED: that would remove the last admin (${adminSet.size} exist, ${actuallyAdmin.length} named).`
      );
      console.error(`[migrate-roles] Promote a replacement first, or pass --force if you mean it.`);
      process.exit(1);
    }

    for (const email of demoteEmails) {
      if (!adminSet.has(email)) {
        console.warn(`[migrate-roles] WARNING: ${email} is not an admin — nothing to do.`);
        continue;
      }
      if (CHECK_ONLY) {
        log(`--check: would demote ${email} to ${DEFAULT_ROLE}.`);
      } else {
        await conn.query(
          `UPDATE \`${TABLE}\` SET \`${COLUMN}\` = ? WHERE LOWER(email) = ?`,
          [DEFAULT_ROLE, email]
        );
        log(`demoted ${email} to ${DEFAULT_ROLE}.`);
      }
    }

    const [[{ admins }]] = await conn.query(
      `SELECT COUNT(*) AS admins FROM \`${TABLE}\` WHERE \`${COLUMN}\` = ?`,
      [ADMIN_ROLE]
    );
    log(`admins remaining: ${admins}`);
    process.exit(0);
  }

  /* ---------------------------------------------------------- rollback */

  if (ROLLBACK) {
    if (!roleColumn) {
      log("nothing to roll back — column does not exist.");
    } else if (CHECK_ONLY) {
      log(`--check: would DROP COLUMN \`${COLUMN}\`.`);
    } else {
      await conn.query(`ALTER TABLE \`${TABLE}\` DROP COLUMN \`${COLUMN}\``);
      log(`rolled back: dropped \`${COLUMN}\`. Roll the application back too — it reads this column.`);
    }
    process.exit(0);
  }

  /* ------------------------------------------------- 1. add the column */

  if (!roleColumn) {
    if (CHECK_ONLY) {
      log(`--check: would ADD COLUMN \`${COLUMN}\` VARCHAR(32) NOT NULL DEFAULT '${DEFAULT_ROLE}'.`);
    } else {
      // VARCHAR(32), not an ENUM: the allowed values are validated in
      // src/lib/portal/permissions.ts so a fourth role is a config change, not a
      // migration on the portal's identity table. MySQL backfills existing rows
      // with the DEFAULT as part of this statement, so no account is more
      // restricted the moment it lands than it was the day before.
      await conn.query(
        `ALTER TABLE \`${TABLE}\` ADD COLUMN \`${COLUMN}\` VARCHAR(32) NOT NULL DEFAULT '${DEFAULT_ROLE}'`
      );
      log(`added \`${COLUMN}\` VARCHAR(32) NOT NULL DEFAULT '${DEFAULT_ROLE}'.`);
    }
  } else {
    log(`\`${COLUMN}\` already present (${roleColumn.Type}) — skipping.`);
  }

  /* ---------------------------------------------------- 2. baseline */

  // Explicit and idempotent even though the DEFAULT already covers the ALTER:
  // it also repairs rows left empty by a partial earlier run, and it makes the
  // baseline an auditable statement rather than a side effect of the DDL.
  if (CHECK_ONLY) {
    if (roleColumn) {
      const [[{ n }]] = await conn.query(
        `SELECT COUNT(*) AS n FROM \`${TABLE}\` WHERE \`${COLUMN}\` IS NULL OR \`${COLUMN}\` = ''`
      );
      log(`--check: would baseline ${n} row(s) to '${DEFAULT_ROLE}'.`);
    }
  } else {
    const [result] = await conn.query(
      `UPDATE \`${TABLE}\` SET \`${COLUMN}\` = ? WHERE \`${COLUMN}\` IS NULL OR \`${COLUMN}\` = ''`,
      [DEFAULT_ROLE]
    );
    log(`baselined ${result.affectedRows} row(s) to '${DEFAULT_ROLE}'.`);
  }

  /* ------------------------------------------------------ 3. promote */

  if (adminEmails.length === 0) {
    log(
      "no admin emails supplied — nobody promoted. Pass --emails=a@x.com,b@y.com or set OFFERGUIDE_ADMIN_EMAILS."
    );
  } else {
    log(`admin list (${adminEmails.length}): ${adminEmails.join(", ")}`);

    for (const email of adminEmails) {
      const [rows] = await conn.query(
        `SELECT \`${COLUMN}\` AS role FROM \`${TABLE}\` WHERE LOWER(email) = ?`,
        [email]
      );

      if (rows.length === 0) {
        // Warn rather than fail: a typo in one address must not abort the run
        // and leave the other promotions half-applied. Re-running after fixing
        // the address is safe.
        console.warn(`[migrate-roles] WARNING: no account for ${email} — not promoted.`);
        exitCode = 0;
        continue;
      }

      if (rows[0].role === ADMIN_ROLE) {
        log(`${email} is already ${ADMIN_ROLE} — skipping.`);
        continue;
      }

      if (CHECK_ONLY) {
        log(`--check: would promote ${email} to ${ADMIN_ROLE}.`);
      } else {
        await conn.query(
          `UPDATE \`${TABLE}\` SET \`${COLUMN}\` = ? WHERE LOWER(email) = ?`,
          [ADMIN_ROLE, email]
        );
        log(`promoted ${email} to ${ADMIN_ROLE}.`);
      }
    }
  }

  /* --------------------------------------------------------- 4. report */

  if (!CHECK_ONLY) {
    const [byRole] = await conn.query(
      `SELECT \`${COLUMN}\` AS role, COUNT(*) AS n FROM \`${TABLE}\` GROUP BY \`${COLUMN}\``
    );
    log(`final roles: ${byRole.map((r) => `${r.role}=${r.n}`).join(", ")}`);

    const [[{ admins }]] = await conn.query(
      `SELECT COUNT(*) AS admins FROM \`${TABLE}\` WHERE \`${COLUMN}\` = ?`,
      [ADMIN_ROLE]
    );
    if (admins === 0) {
      console.warn(
        "[migrate-roles] WARNING: no admin accounts exist. /admin/config/* is unreachable by anyone until one is promoted."
      );
    }
  }
} catch (error) {
  console.error("[migrate-roles] FAILED:", error.message);
  exitCode = 1;
} finally {
  await conn.end();
}

process.exit(exitCode);
