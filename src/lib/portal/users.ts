/**
 * Reading the portal's identity table, `sanjeedausers`.
 *
 * NAME: the OfferGuide sprint handoffs call this table `userinfo`. There is no
 * such table. `prisma.config.ts` names the pre-Prisma portal tables explicitly —
 * `users`, `sanjeedausers`, `forgot_password` — and `candidate_profiles.userinfo_id`
 * stores a `sanjeedausers` primary key despite its column name.
 */

/** A `sanjeedausers` row, as it comes back from `SELECT *`. */
export type PortalUserRow = {
  user_id?: unknown;
  id?: unknown;
  [column: string]: unknown;
};

/**
 * The row's primary key, whichever name this database gives it.
 *
 * The local database calls it `user_id`. The original login handler read
 * `user.id` off a `SELECT *` and got `undefined`; `JSON.stringify` then dropped
 * the key, so every login-issued JWT was signed with no `id` claim at all.
 * Nothing failed loudly — logged-in users simply resolved as guests, and
 * `/claim-guest-profile` 401'd for anyone who logged in rather than signed up.
 *
 * Reading both names rather than selecting one explicitly is deliberate: the
 * production column name has not been verified against local, and a
 * `SELECT user_id AS id` that guesses wrong would take login down entirely
 * instead of degrading. Once production is confirmed, collapse this to the real
 * column and delete the fallback.
 *
 * Returns null rather than a number for anything that is not a positive
 * integer, so a malformed row can never mint a token claiming to be user 0.
 */
export function userIdOf(row: PortalUserRow | null | undefined): number | null {
  if (!row) return null;

  const raw = row.user_id ?? row.id;
  if (raw === null || raw === undefined || raw === "") return null;

  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}
