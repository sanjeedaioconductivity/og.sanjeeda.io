import jwt from "jsonwebtoken";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "@/utils/mysql";
import { userIdOf } from "@/lib/portal/users";

/**
 * The portal session token, shared by every sign-in route.
 *
 * Moved here from api/auth/route.ts when LinkedIn and OTP sign-in were added, so
 * there is still exactly one place that decides what a portal JWT contains and
 * how long it lives. `setPortalCookie` (lib/offerguide/identity) sets the cookie
 * lifetime to match the 1h expiry below; change both together.
 */
export function createPortalToken(user: { id: number; name: string; email: string }): string {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    process.env.JWT_SECRET || "default_secret",
    { expiresIn: "1h" }
  );
}

type UserRow = RowDataPacket & { user_id?: number; id?: number; name: string; email: string };

/**
 * Finds the `sanjeedausers` row for an email a provider has VERIFIED, or creates
 * one with no password (like a Google sign-up). Same table, same raw-SQL writer
 * as api/auth/route.ts — Prisma must not write this table (see schema.prisma).
 *
 * Only call this with an email the provider vouched for. Linking by an
 * unverified email would let anyone claim an existing account.
 */
export async function findOrCreateUserByVerifiedEmail(
  name: string,
  email: string
): Promise<{ id: number; name: string; email: string; created: boolean }> {
  const normalized = email.trim().toLowerCase();
  const [rows] = await db.execute<UserRow[]>("SELECT * FROM SanjeedaUsers WHERE email = ?", [normalized]);

  if (rows.length > 0) {
    const id = userIdOf(rows[0]);
    if (id === null) {
      throw new Error("sanjeedausers row has no readable id column");
    }
    return { id, name: rows[0].name || name, email: normalized, created: false };
  }

  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO SanjeedaUsers (name, email) VALUES (?, ?)",
    [name, normalized]
  );
  return { id: result.insertId, name, email: normalized, created: true };
}

/**
 * A same-site path to send the browser back to after an external sign-in.
 * Anything else (absolute URLs, protocol-relative `//evil.com`, backslashes)
 * falls back, so the redirect can't be turned into an open redirect.
 */
export function safeReturnPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
