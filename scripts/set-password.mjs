#!/usr/bin/env node
/**
 * Operational: inspect or set the portal password for one `sanjeedausers` row.
 *
 *   node scripts/set-password.mjs --email=a@x.com --prod                 show status
 *   node scripts/set-password.mjs --email=a@x.com --password=... --prod  set it
 *
 * Same DB_* / DB_PROD_* env handling as migrate-roles.mjs. Exists because the
 * only other way to give someone a password is the emailed reset code, which
 * lands in THEIR inbox — useless when an operator is provisioning an account
 * for someone else. Never prints a password.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);
const PROD = args.prod === true;
const email = String(args.email || "").trim().toLowerCase();
const password = typeof args.password === "string" ? args.password : null;

if (!email) {
  console.error("usage: --email=<address> [--password=<new>] [--prod]");
  process.exit(1);
}

for (const file of [".env.local", ".env"]) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && process.env[m[1]] === undefined)
      process.env[m[1]] = m[2].trim().replace(/^(["'])(.*)\1$/, "$2");
  }
}

const P = PROD ? "DB_PROD_" : "DB_";
const conn = await mysql.createConnection({
  host: process.env[`${P}HOST`],
  port: Number(process.env[`${P}PORT`] || (PROD ? 4000 : 3306)),
  user: process.env[`${P}USER`],
  password: process.env[`${P}PASS`],
  database: process.env[`${P}NAME`],
  ...(PROD ? { ssl: { minVersion: "TLSv1.2" } } : {}),
});
console.log(`[set-password] target: ${PROD ? "PRODUCTION" : "local"} — ${process.env[`${P}NAME`]} at ${process.env[`${P}HOST`]}`);

const [rows] = await conn.query(
  "SELECT id, name, role, password IS NOT NULL AND password <> '' AS has_password, google_id IS NOT NULL AS has_google FROM sanjeedausers WHERE email = ?",
  [email]
);
if (rows.length === 0) {
  console.error(`[set-password] no account for ${email} — sign up first, then re-run.`);
  await conn.end();
  process.exit(1);
}
const u = rows[0];
console.log(`[set-password] #${u.id} ${email}  role=${u.role}  password=${u.has_password ? "set" : "NONE"}  google=${u.has_google ? "linked" : "no"}`);

if (password !== null) {
  if (password.length < 8) {
    console.error("[set-password] refusing: password shorter than 8 characters.");
    await conn.end();
    process.exit(1);
  }
  await conn.query("UPDATE sanjeedausers SET password = ?, reset_code = NULL, reset_code_expiry = NULL WHERE email = ?", [password, email]);
  console.log(`[set-password] password updated for ${email}.`);
}
await conn.end();
