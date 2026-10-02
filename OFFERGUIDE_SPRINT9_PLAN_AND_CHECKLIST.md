# OfferGuide — Sprint 9 Review, Plan & DoD Checklist

**Scope:** Phase A — RBAC & permission infrastructure for the sanjeeda.io portal,
plus replacing OfferGuide's interim admin gate with real `adminAuth`.

**Sources of truth:**

| Doc | Notes |
|---|---|
| `OG_Sprint9_Handoff_v1_0.pdf` | scope, four outcomes, §8 DoD |
| the repository, read directly | **authoritative where it contradicts the handoff — see Part 0** |
| `public/openapi.yaml` | the published contract |
| `prisma.config.ts` | the authoritative list of pre-Prisma portal tables |

**Baseline at sprint start:** 13 test files, 297 tests, all green
(`npm test`, verified). Branch `offerguide-pgp-work` carries uncommitted Sprint 7/8
work — land or stash that before starting; Sprint 9 touches the identity layer and
must not be interleaved with unrelated changes.

---

## PART 0 — WHERE THE HANDOFF AND THE REPOSITORY DISAGREE

The handoff was written against a portal that does not match this one. Nine of its
assumptions are wrong at the code level. None of them invalidate the sprint's goal,
but several change what the work actually is, and two of them turn out to be the
sprint's real content. **Read this section before Part 2.**

### 0.1 There is no `userinfo` table

The portal's identity table is **`sanjeedausers`** (MySQL/TiDB, raw `mysql2`).
`prisma.config.ts` names the pre-Prisma tables explicitly: `users`, `sanjeedausers`,
`forgot_password`. Local introspection confirms it — there is no `userinfo`
anywhere in the database.

`candidate_profiles.userinfo_id` is a *column name*; the value it stores is a
`sanjeedausers` primary key. `schema.prisma`'s header comment and every handoff
reference to "`userinfo`" mean this table.

**Effect:** wherever the handoff says `userinfo`, read `sanjeedausers`. The Prisma
model is still called `UserInfo` (the handoff names it, and `CandidateProfile.userInfoId`
already matches), mapped with `@@map("sanjeedausers")`.

### 0.2 The primary key is `user_id`, and the JWT drops it — P0 blocker

`sanjeedausers` columns (local, verified):

```
user_id  int  NOT NULL
name  varchar(100)  NOT NULL
email  varchar(100)  NOT NULL
password  varchar(255)  NULL
google_id  varchar(255)  NULL
reset_code  varchar(10)  NULL
reset_code_expiry  datetime  NULL
```

The primary key is **`user_id`**, not `id`. But
[`src/app/api/auth/route.ts:201`](src/app/api/auth/route.ts:201) does:

```ts
const [rows] = await db.execute<UserRow[]>("SELECT * FROM SanjeedaUsers WHERE email = ?", [...]);
const user = rows[0];
const token = createToken({ id: user.id, name: user.name, email: user.email });
```

`user.id` is `undefined`. `JSON.stringify` drops undefined keys, so **every
login-issued JWT is signed with no `id` claim at all**. Downstream,
[`identity.ts:28`](src/lib/offerguide/identity.ts:28) computes `Number(undefined)` → `NaN`,
and both `resolveIdentity()` and `resolveAuthedUser()` correctly reject it.

Consequences, all of them live today:

- A logged-in user calling OfferGuide is resolved as a **guest**, never as a user.
- `POST /claim-guest-profile` returns **401 for anyone who logged in** — it only
  works on a token issued by `signup`, which uses `result.insertId` and therefore
  does carry a real `id`. The Sprint 9 DoD line *"`/claim-guest-profile` still links
  a guest profile to a newly registered account"* passes only by that accident.

**This must be fixed before any role check is built on top of it.** A `role` lookup
keyed on a `userInfoId` that is always `NaN` cannot work.

> **Pre-check required:** the column layout above is from the *local* database.
> Confirm production matches before writing the migration:
> ```bash
> node -e "require('mysql2/promise').createConnection({host:process.env.DB_PROD_HOST,user:process.env.DB_PROD_USER,password:process.env.DB_PROD_PASS,database:process.env.DB_PROD_NAME,port:+process.env.DB_PROD_PORT,ssl:{minVersion:'TLSv1.2'}}).then(c=>c.query('SHOW COLUMNS FROM sanjeedausers')).then(([r])=>console.table(r))"
> ```
> If production uses `id` while local uses `user_id`, that divergence is itself a
> defect and has to be resolved before the migration, not after.

### 0.3 The portal has no client-side session at all

`authToken` is written on login and Google login
([`auth/page.tsx:123`](src/app/auth/page.tsx:123), [`:167`](src/app/auth/page.tsx:167)).
`token` is written by [`GoogleLoginButton.tsx:46`](src/app/components/GoogleLoginButton.tsx:46).

**Neither key is ever read.** There is no `getItem("authToken")` and no
`getItem("token")` anywhere in `src/`. Nothing sends an `Authorization` header:
the only `Bearer` strings in the codebase are in `identity.ts` (the server side) and
a test. OfferGuide's client
([`_state/api.ts:38`](src/app/offerguide/_state/api.ts:38)) sends
`credentials: 'include'` and nothing else — the guest cookie, by design.

So the portal issues a JWT and immediately discards it. There is no authenticated
session on the client, in any feature.

**This is the sprint's real content.** The handoff asks for `usePermission()`, an
`AuthProvider`, and a three-tier nav whose middle tier is "authenticated". None of
that has a substrate today. Building the permission layer without first building the
session gives you a map with three tiers of which exactly one (public) can ever be
reached.

### 0.4 No route in the portal verifies a JWT

Story 9.1.1 opens: *"Today JWT verification is duplicated inline across the portal's
route handlers."* It is not. A grep for `jwt.`, `authorization`, `Bearer`, or
`cookies()` across all of `src/app/api/` returns **four files**, all of them the auth
endpoints themselves, and all of them *signing* rather than verifying.

The only JWT verification in the portal is
[`src/lib/offerguide/identity.ts`](src/lib/offerguide/identity.ts) — which already is
the centralized implementation Story 9.1.1 asks for, minus the middleware wrapper.

PP, CRR, Blogs and the khudi endpoints are **unauthenticated at the API layer**. The
pgp dashboards gate on a `localStorage` object client-side only, which is not an
access control.

**Effect on scope:** there is nothing to "leave untouched", and the §7 backlog item
*"Legacy route migration to middleware.ts"* has no subject. What the backlog actually
needs is *"add authentication to the legacy features"*, which is a much larger and
more honest item. The deliberate-narrow-scope comment in `middleware.ts` should say
this plainly rather than implying the excluded routes have their own checks.

### 0.5 Middleware cannot see a `localStorage` token

Browsers do not attach `Authorization` headers to page navigations. If the portal JWT
stays in `localStorage`, `middleware.ts` can resolve identity for *API* calls that
explicitly set the header, and **never** for OfferGuide page routes.

That directly collides with the Epic 9.2 acceptance criterion:

> The nav renders correctly for a guest with no flash of authenticated-tier items
> during hydration.

With a `localStorage` identity source, the server always renders the guest nav and the
client corrects it after mount — which is precisely the flash the criterion forbids.
The only ways out are to render nothing until identity resolves (a visible layout
shift on every page load) or to put the token somewhere the server can read.

**Decision required, and it gates Epics 9.1 and 9.2 both.** See §2.1 D-1.

### 0.6 `jsonwebtoken` does not run in middleware's default runtime

Next.js middleware runs on the Edge runtime by default. `jsonwebtoken` (used
throughout this repo) depends on Node's `crypto` and will not load there. Next 16
supports `export const runtime = 'nodejs'` in middleware; the alternative is `jose`.

Also: this is a single Next app with a `src/` directory, not a monorepo. Middleware
goes at **`src/middleware.ts`**. The handoff's `apps/web/app/middleware.ts` is neither
this project's layout nor a valid Next.js middleware location.

### 0.7 The admin surface is 30 operations, not 26

Counted from the route files and cross-checked against `public/openapi.yaml`, which
carries **30** `AdminToken: []` security declarations:

| Path | Ops |
|---|---|
| `/admin/config/questions` + `/{fieldId}` | 5 |
| `/admin/config/market-benchmarks` + `/{id}` | 5 |
| `/admin/config/geography` + `/{countryCode}` | 5 |
| `/admin/config/geography/{countryCode}/cities` (POST) | 1 |
| `/admin/config/geography/{countryCode}/cities/{cityId}` (PATCH) | 1 |
| `/admin/config/functional-domains` + `/{domainId}` | 5 |
| `/admin/config/consent-toggles` + `/{toggleId}` | 5 |
| `/admin/config/scoring` (GET, POST) + `/{version}` (GET) | 3 |
| **Total** | **30** |

The "26" predates the two geography-cities operations Sprint 8 added (its own §D3
lists them as new). `README.md:65` repeats the stale number and needs the same edit.

The route paths are `/api/offerguide/admin/config/*`, not `/admin/config/*` — the
middleware matcher must use the real prefix.

### 0.8 The nav is one component with two hardcoded arrays

- [`layout.tsx:70`](src/app/layout.tsx:70) renders `<ResponsiveNav/>`.
- [`ResponsiveNav.tsx`](src/app/components/nav/ResponsiveNav.tsx) is an 11-line
  wrapper that renders `<ModernHeader/>` and nothing else.
- [`ModernHeader.tsx:18-28`](src/app/components/nav/ModernHeader.tsx:18) holds
  `mainLinks` and `serviceLinks` and renders each array **twice** — once for the
  desktop bar, once for the mobile drawer.
- `src/app/components/nav/Header.tsx` is **dead code**; nothing imports it.
- There is **no Sidebar** in the portal shell. `SidebarContent` exists three times as
  a local function inside the candidate / mentor / management dashboard pages.
- There is **no `navSections`** in the pgp module. Each dashboard has a local
  `const NAV = [{ label, icon }]` driving an in-page tab switcher
  ([`candidate/dashboard/page.tsx:19`](src/app/candidate/dashboard/page.tsx:19)) —
  not routes, not permissions, not a pattern worth generalizing.

The handoff anticipated this ("the pgp module's navSections implementation was not
available when this handoff was written"). The honest read: **there is no proven
pattern to generalize.** Epic 9.2 is a new build against the stated behaviour, and the
DoD line *"Header, ResponsiveNav, and Sidebar share one section declaration"* should be
restated as *"every nav surface renders from one declaration"* — which today means
ModernHeader's two render passes.

"Offer Guide" already sits in `serviceLinks`; that is the Sprint 2 entry to replace.

### 0.9 The regression checklist names things that do not exist

Epic 9.3's acceptance criteria assume behaviour this portal does not have:

| Criterion | Reality |
|---|---|
| "Login, **logout**, and session persistence work unchanged" | There is **no logout** for the portal account. `authToken` is never removed. There is no session to persist — see §0.3. |
| "The Sprint 1 **bcrypt** password path is unaffected" | `/api/auth` stores and compares **plaintext** passwords (`user.password !== password`, [`route.ts:194`](src/app/api/auth/route.ts:194)). `bcryptjs` is used only by the three pgp Mongo endpoints. There was no Sprint 1 bcrypt migration on this table, so it is also not available as the precedent Story 9.1.2 cites for the plain-SQL migration. |
| "Each existing feature … confirming its **inline auth check** still passes" | No inline auth checks exist (§0.4). The check becomes "still loads and functions". |

Plaintext password storage is a genuine security defect. It is **out of scope for
Sprint 9** — it is not RBAC, and hashing the column is its own migration with its own
rollout — but it must be raised, not silently absorbed. See §4.2.

### 0.10 Smaller corrections

- **`NAMING_CONVENTIONS.md`, `API_SETUP_GUIDE.md`, and the Project Charter are not in
  this repository.** The handoff cites §3, §5, §10, §1, §3, §8 and §9 of them as
  binding. Either they are added to the repo or the citations are treated as
  unverifiable and the conventions inferred from existing code.
- **There is no `.env.example`.** The DoD item "remove the env var from `.env.example`"
  has no target. `OFFERGUIDE_ADMIN_TOKEN` lives in `.env.local` and in the Vercel
  project config.
- **`prisma db pull` will destroy `schema.prisma`'s documentation.** Introspection
  preserves `///` doc comments only; this schema's ~30 lines of `//` header notes and
  every inline `//` field comment would be lost. Do not run a bare `db pull` — see
  §2.3.
- **`requireAdmin()` is synchronous.** A real role check reads the database, so it
  becomes `async`. Every call site in
  [`adminCrud.ts`](src/lib/offerguide/adminCrud.ts) and the four hand-written admin
  routes needs `await`.
- **`/api-docs` is public and unauthenticated** ([`api-docs/page.tsx`](src/app/api-docs/page.tsx)).
  Epic 9.2 points the admin nav tier at it. Hiding a link is not access control —
  decide whether the page itself is gated. See §2.1 D-3.
- **`adminGate.test.ts` asserts the opposite of Sprint 9.** Its structural test checks
  that no `role` reference has crept into the gate
  ([`adminGate.test.ts:10`](src/lib/offerguide/adminGate.test.ts:10)). That assertion
  inverts this sprint.
- **pgp is a second, independent identity system.** `CandidateUser` / `MentorUser` /
  `ManagementUser` are Mongo collections with their own bcrypt, their own JWTs, and
  their own `role` field (defaulting to `"Candidate"`,
  [`pgp-candidate/auth/route.ts:13`](src/app/api/pgp-candidate/auth/route.ts:13)).
  A shared `AuthProvider` over the MySQL account does not cover them, and unifying the
  two is a much larger effort. Say so in the provider's own header comment.
- **No OfferGuide history screen exists.** `offerguide.history.view` is a permission
  with nothing behind it. `getEvaluationSessions()` exists in the API client but no
  page consumes it. Defining the permission is fine; note that it gates nothing yet.

---

## PART 1 — WHAT ALREADY EXISTS AND IS CORRECT

Do not rebuild these.

| Asset | State |
|---|---|
| [`identity.ts`](src/lib/offerguide/identity.ts) — `resolveIdentity()` / `resolveAuthedUser()` | ✅ Already the single JWT verification path. JWT takes precedence over the guest cookie; the bearer-only path has no guest fallback. Correct `NaN` guards. This is the core Story 9.1.1 asks for. |
| `guestToken` cookie handling — `mintGuestToken()`, `setGuestCookie()` | ✅ httpOnly, `secure` in production, `sameSite: lax`, 180-day life. Do not touch. |
| `requireAdmin()` fail-closed behaviour | ✅ Unset env var rejects everything. Preserve this property through the swap. |
| Admin gate centralization | ✅ 26 of the 30 operations route through `adminCrud.ts`'s two factories; only 4 are hand-written. The swap is a small, contained change. |
| `adminGate.test.ts` route-walking harness | ✅ Enumerates admin route files from disk and asserts each calls the gate. Keep the harness; replace the assertions. |
| Guest path end to end | ✅ SCR-000 → SCR-010 works with no account, which is the behaviour Sprint 9 must not break. |
| Test suite | ✅ 297 tests, 13 files, green. |

---

## PART 2 — BUILD PLAN

Six phases. Phases 0–1 are sequential and gate everything else; 2–4 can overlap once
1 lands; 5 and 6 close the sprint.

### 2.1 Decisions to take before writing code

**D-1 — Where does the portal JWT live? (gates Epics 9.1 and 9.2)**

*Recommendation: issue an httpOnly `portalToken` cookie alongside the existing
`localStorage` write.*

`/api/auth` sets the cookie on `login`, `signup` and `google-login`; the existing
`localStorage.setItem` calls stay exactly as they are. Because nothing reads those
keys (§0.3), this is purely additive — no existing behaviour can regress, which is the
property this sprint needs most.

What it buys: `middleware.ts` can resolve identity on page routes; the server renders
the correct nav tier on the first paint, satisfying the no-hydration-flash criterion
without a render-nothing hack; OfferGuide's client keeps working unchanged, since it
already sends `credentials: 'include'`.

The alternative — keep `localStorage` and have `AuthProvider` attach an `Authorization`
header — cannot satisfy the no-flash criterion and leaves the token readable by any
script on the page. Take it only if the cookie is rejected for a reason not visible in
the code.

**D-2 — Where does `role` come from on a server-side check?**

*Recommendation: read it from the database on each `adminAuth` check.*

Prisma reads `UserInfo.role` by `userInfoId` from the verified token. The admin surface
is 30 low-traffic operations; a query per check is not a cost worth optimizing, and it
makes a demotion take effect immediately rather than at the next token expiry. Adding
`role` as a JWT claim is a later optimization, not this sprint's design.

**D-3 — Is `/api-docs` gated?**

*Recommendation: leave it public this sprint, and say so explicitly in the nav
config.* Gating it means adding a page-level redirect for a route the handoff does not
list in the matcher, and the contract it renders is already public information. Record
it as a known limitation rather than an oversight.

### 2.2 Phase 0 — Repair the session (P0, blocks everything)

Not in the handoff. Required by §0.2 and §0.3: the permission layer has nothing to
stand on until this lands.

1. **Verify production's `sanjeedausers` columns** against §0.2's pre-check. Resolve
   any local/production divergence first.
2. **Fix the `id` claim.** In [`api/auth/route.ts`](src/app/api/auth/route.ts), select
   the primary key explicitly (`SELECT user_id AS id, ...`) rather than `SELECT *`, in
   `handleLogin` and `handleGoogleLogin`. Keep `handleSignup` on `result.insertId`.
3. **Set the httpOnly `portalToken` cookie** on all three success paths (per D-1).
   Same flags as `guestToken`: `httpOnly`, `secure` in production, `sameSite: lax`,
   `path: /`. Lifetime matches the JWT's `1h`.
4. **Teach `identity.ts` to read the cookie** as a fallback after the `Authorization`
   header, keeping header precedence. The guest-cookie branch stays last, so the
   documented precedence becomes: bearer header → portal cookie → guest cookie → null.
5. **Build a real logout** — `POST /api/auth` with `action: "logout"` clearing the
   cookie, plus a client call that also clears both `localStorage` keys. Epic 9.3 asks
   us to regression-test logout; this creates the thing to test.
6. **Collapse the duplicate key.** `GoogleLoginButton` writes `token`; `auth/page.tsx`
   writes `authToken`. Standardize on `authToken` and delete the other write.

**Tests:** a login-issued JWT carries a numeric `id`; `resolveIdentity` returns
`{ type: "user" }` for it; `resolveAuthedUser` returns the id;
`POST /claim-guest-profile` succeeds for a *login*-issued token, not only a
signup-issued one; logout clears the cookie and a subsequent request resolves as guest.

### 2.3 Phase 1 — `role` column and the permission map (Story 9.1.2, part 1)

1. **Plain SQL migration** — `prisma/migrations/<ts>_add_role_to_sanjeedausers/migration.sql`:
   ```sql
   ALTER TABLE `sanjeedausers` ADD COLUMN `role` VARCHAR(32) NOT NULL DEFAULT 'user';
   ```
   `VARCHAR(32)`, not an `ENUM` — the handoff's reasoning holds and the anticipated
   fourth role (a benchmark data steward) must be a config change.

   `sanjeedausers` is currently declared **external** in
   [`prisma.config.ts`](prisma.config.ts). Migrating a table Prisma is told to ignore
   needs care: remove it from `tables.external` in the same change that adds the
   `UserInfo` model, or Prisma will keep treating it as none of its business. Run
   `prisma migrate status` before and after and confirm no drift is reported —
   a spurious reset offer here would drop the portal's real data.

2. **Add the `UserInfo` model by hand.** Do **not** run a bare `prisma db pull` (§0.10).
   If you want introspection's output, pull into a scratch schema
   (`prisma db pull --schema=/tmp/scratch.prisma`) and copy the model block across.
   The model is read-only from OfferGuide's perspective — raw `mysql2` in `/api/auth`
   keeps ownership of writes. Say that in a comment above the model, and add **no**
   relation to `CandidateProfile`: `userInfoId` stays a plain `Int?`.

3. **Static role → permission map**, in `src/lib/offerguide/permissions.ts` (server) —
   or the portal-shared equivalent, since this is portal infrastructure and not
   OfferGuide's alone:

   | Permission | public | user | admin |
   |---|---|---|---|
   | `offerguide.wizard.use` | ✅ | ✅ | ✅ |
   | `offerguide.history.view` | — | ✅ | ✅ |
   | `offerguide.config.read` | — | — | ✅ |
   | `offerguide.config.write` | — | — | ✅ |
   | `portal.admin.access` | — | — | ✅ |

   Export `hasPermission(identity, permission)` where `identity` may be `null`.
   `admin` is a superset of `user` by construction — express it as set union, so no
   future edit can grant a permission to `user` and withhold it from `admin`.
   Validate the stored string against the allowed values here; the column does not.

**Tests:** map covers all five permissions; `hasPermission(null, ...)` returns `false`
without throwing for every permission; every `user` permission is also an `admin`
permission (property test, so it holds for permissions added later); an unknown role
string resolves to `user`.

### 2.4 Phase 2 — `src/middleware.ts` (Story 9.1.1)

```ts
export const runtime = 'nodejs';   // jsonwebtoken cannot run on Edge — §0.6
export const config = { matcher: [...] };
```

Matcher covers `/offerguide/:path*`, `/api/offerguide/:path*` (which includes the real
admin prefix `/api/offerguide/admin/config/*`). Everything else is excluded, with a
comment stating the truth from §0.4: the excluded features have **no** auth checks of
their own, this is a deliberate narrow scope, and adding authentication to them is a
scheduled follow-up — not an implication that they are already protected.

Resolve three states and pass the result downstream on request headers
(`x-identity-type`, `x-user-info-id`, `x-user-role`). **Strip those headers from the
incoming request first** — otherwise a client can forge them, and the middleware
becomes an authentication bypass rather than an authentication layer. This is the
single highest-risk line in the sprint; test it explicitly.

Behaviour, per the contract's optional-auth semantics:

- No token → public. Guest-cookie issuance is unchanged.
- Valid token → authenticated, with `userInfoId` and `role`.
- **Invalid or expired token on a `guestOrAuth` route → falls through to guest, not 401.**
- Only `bearerAuth` and `adminAuth` routes reject.

Keep `identity.ts` as the verification implementation and have the middleware call it —
do not fork a second copy. Add `verifyJwt.ts` only if the split earns its keep;
`identity.ts` already holds both functions and the handoff's file-naming criterion is
satisfied by camelCase either way.

**Tests:** each of the three identity states; forged `x-user-role: admin` on an
inbound request is stripped and does not grant anything; an expired token on a
`guestOrAuth` route yields guest, not 401; the matcher excludes `/api/pgp-*`,
`/api/crr`, `/api/khudi-*` and the Blogs routes.

### 2.5 Phase 3 — Real `adminAuth` (Story 9.1.4)

1. Rewrite `requireAdmin()` in
   [`adminAuth.ts`](src/lib/offerguide/adminAuth.ts) as **`async`**: verify the JWT,
   read `UserInfo.role` via Prisma, check `portal.admin.access` through the Phase 1
   map. Never `role === 'admin'` at a call site.
2. `await` it in `adminCrud.ts`'s five handlers and in the four hand-written routes
   (`scoring/route.ts`, `scoring/[version]/route.ts`, `geography/.../cities/route.ts`,
   `geography/.../cities/[cityId]/route.ts`).
3. **Delete the interim gate completely** — the `x-og-admin-token` header constant, the
   `OFFERGUIDE_ADMIN_TOKEN` read, and the placeholder comments. Not left as a fallback.
   Remove the variable from `.env.local` and from the Vercel project configuration.
   (There is no `.env.example` to edit — §0.10.)
4. Update `openapi.yaml`: replace the `AdminToken` scheme with the real requirement
   (bearer JWT whose role is `admin`), update the §description bullet at line 30, and
   change all 30 `security:` declarations.
5. Update `README.md` — the "admin gate is temporary" section, and the stale
   "26-operation surface" at line 65.
6. **Rewrite `adminGate.test.ts`.** Keep the disk-walking harness; replace the
   assertions with the four credential cases across all 30 operations: no credentials
   → reject; guest cookie only → reject; valid `user`-role JWT → reject; valid
   `admin`-role JWT → succeed. Invert the structural test: assert every admin route
   reaches the gate, and that **no call site compares `role` directly**.

**Contract integrity, re-verified after the swap:** scoring config versions stay
POST-only (no `PUT`/`PATCH` route exists), and retiring the master consent toggle still
returns 409 via `blockMasterToggleDeletion()`.

### 2.6 Phase 4 — `AuthProvider`, `usePermission()`, and the nav (Stories 9.1.2 part 2, 9.2.1)

1. **`AuthProvider.tsx`** + `authProvider.ts` for the non-component helpers. Single
   client-side source of identity: authenticated state, `userInfoId`, `role`. It reads
   what the server resolved (from the `portalToken` cookie via a server component or a
   small `/api/auth/session` read) rather than introducing a new `localStorage` key.
   Mount it in the **root** layout — this is portal infrastructure, not an OfferGuide
   concern, and `offerguide/layout.tsx` is explicitly documented as layout-only.
   Header comment must record that pgp's Mongo identities are **not** covered (§0.10).
2. **`usePermission(permission)`** — boolean, reads the same map as the server, handles
   a null identity without throwing, redirecting, or logging. It is a convenience;
   the server check is the enforcement point, always.
3. **Nav sections config** — a declaration of `{ label, href, icon, permission }`,
   living beside the permission map. Three tiers: public (including the OfferGuide
   entry, which must stay reachable with no account), authenticated, admin
   (`/api-docs` only, per D-3).
4. **`ModernHeader.tsx` renders from it.** Replace `mainLinks`/`serviceLinks` with a
   filter over the declaration — the same filtered list feeds both the desktop bar and
   the mobile drawer, so the two render passes stop being two lists. No
   `if (role === ...)` inside any nav component. Replace the Sprint 2 "Offer Guide"
   entry in `serviceLinks`; do not leave it duplicated alongside the new one.
   Every existing portal entry must still appear exactly as it does today.
5. **No hydration flash** — the cookie from D-1 lets the server render the correct
   tier on first paint. Verify by loading as a guest with JS disabled, then with a
   throttled connection.
6. Delete the dead [`nav/Header.tsx`](src/app/components/nav/Header.tsx) while you are
   in there, or leave it — but do not wire it to the new declaration.

**Tests:** `usePermission` returns `false` for a null identity across all five
permissions; nav filtering yields exactly the public set for a guest, public+auth for a
user, all three for an admin; a grep test asserts no `role ===` comparison exists in
`src/`.

### 2.7 Phase 5 — Baseline migration and admin assignment (Story 9.1.3)

`scripts/migrate-roles.mjs`, following the shape of the existing
[`scripts/migrate-prod.mjs`](scripts/migrate-prod.mjs).

- Sets `role = 'user'` for every existing row **before** the column is enforced
  non-null. The `DEFAULT 'user'` in the DDL already guarantees this for the ALTER
  itself; the script exists so the state is explicit, auditable, and re-runnable.
- **Idempotent** — running twice produces the same result. Use
  `UPDATE ... WHERE role IS NULL OR role = ''` and an exact-match promote.
- **Admin list from `OFFERGUIDE_ADMIN_EMAILS` (comma-separated) or a `--emails=`
  argument.** Never hardcoded, never committed. Promote by email; log each promotion
  by email, and log a warning for any address with no matching row rather than failing
  silently.
- **Reversible.** Document the rollback: `UPDATE sanjeedausers SET role = 'user'` to
  undo promotions, `ALTER TABLE sanjeedausers DROP COLUMN role` to undo the schema.
  Verify the rollback on a copy before shipping, not after.
- **README section** on promoting a user after launch, since no interface exists —
  and state plainly that there is no self-service promotion, no admin UI, and no API
  endpoint that changes a role.

### 2.8 Phase 6 — Auth & session regression (Epic 9.3)

Manual, recorded as a written pass/fail checklist attached to the PR — this is the
portal's first auth regression record. Follow the format of
[`OFFERGUIDE_SPRINT8_MANUAL_QA.md`](OFFERGUIDE_SPRINT8_MANUAL_QA.md) and write it to
`OFFERGUIDE_SPRINT9_AUTH_REGRESSION.md`.

Run the whole list **before** the role migration and **after** it. Where §0.9 shows a
criterion has no subject, record why rather than marking it passed:

| # | Check | Note |
|---|---|---|
| 1 | Login with an existing account | |
| 2 | Signup for a new account | |
| 3 | Logout | **New in Phase 0.** Records the first baseline, not "unchanged". |
| 4 | Session persists across a reload | **New in Phase 0** — see §0.3. |
| 5 | Password path | Records **plaintext** as found. Not "bcrypt unaffected" — §0.9. |
| 6 | Password reset end to end (`send-code` → `verify-code`) | |
| 7 | Google login (`google-login`) | |
| 8 | PP loaded as a registered user, and logged out | Behaviour unchanged; no auth check exists either way — §0.4 |
| 9 | pgp loaded as a registered user, and logged out | Separate Mongo identity — §0.10 |
| 10 | CRR loaded as a registered user, and logged out | |
| 11 | Blogs loaded as a registered user, and logged out | |
| 12 | OfferGuide full guest path, SCR-000 → SCR-010, no account | |
| 13 | `POST /claim-guest-profile` after registering | Must now pass for a **login**-issued token too — §0.2 |
| 14 | All 30 admin operations, four credential cases each | Automated in Phase 3; record the run |
| 15 | Sprint 8 §3.1 54-operation checklist re-run against admin routes | |

---

## PART 3 — DEFINITION OF DONE

Handoff §8, corrected against Part 0. Additions marked **[+]**; corrections marked
**[~]**.

**Phase 0 — session repair [+]** — *implemented; see §5 for what was verified*
- [x] **[+]** Production `sanjeedausers` columns confirmed (2026-09-02) and the divergence resolved — production's key is **`id`**, local was renamed to match, `schema.prisma` corrected. See §6.6. `userIdOf()` keeps reading `user_id ?? id`, which is what kept login working on both while they differed.
- [x] **[+]** Login- and Google-issued JWTs carry a positive-integer `id`; a row with no readable key fails loudly instead of minting a claimless token.
- [x] **[+]** httpOnly `portalToken` cookie issued on login, signup and Google login; `identity.ts` reads it after the bearer header and before the guest cookie.
- [x] **[+]** Logout exists (`POST /api/auth`, `action: "logout"`), clears the cookie and both `localStorage` keys, and leaves the guest cookie intact.
- [x] **[+]** `POST /claim-guest-profile` accepts a token carrying a real `id` and still rejects a claimless one.
- [x] **[+]** Only one `localStorage` JWT key remains (`authToken`); the dead `token` write and the `/api/google-login` call that never existed are gone.
- [x] **[+]** A `null`, empty, zero, negative or fractional `id` claim cannot authenticate.

**Epic 9.1 — auth & permissions**
- [x] **[~]** **`src/proxy.ts`** (not `apps/web/app/middleware.ts` — Next 16 renamed the convention), runs on the Node runtime **by default**, covers OfferGuide and `/api/offerguide/admin/config/*`, and excludes legacy features with a comment stating they have **no** auth checks of their own. See §7.3.
- [x] **[+]** Identity headers are stripped from inbound requests before being set; a forged `x-og-user-role: admin` grants nothing. Unit-tested and verified live.
- [x] Invalid/expired JWTs fall through to guest on `guestOrAuth` routes and reject on `bearerAuth` / `adminAuth` routes.
- [x] `guestToken` cookie issuance and reuse unchanged — verified after the proxy landed.
- [x] **[~]** `role` added to **`sanjeedausers`** as `VARCHAR(32) NOT NULL DEFAULT 'user'`, not an `ENUM`.
- [x] **[~]** `UserInfo` model added **by hand** (no bare `db pull`), `@@map("sanjeedausers")`, marked read-only, no relation to `CandidateProfile`. `schema.prisma`'s `//` comments intact.
- [x] **[~]** `sanjeedausers` **stays** in `tables.external`. Taking it off — as originally planned — makes Prisma propose dropping `password`, `google_id` and both reset-code columns. See §6.3. `prisma migrate diff` now reports an empty migration.
- [x] `AuthProvider` built and mounted in the **root** layout; no new auth-related `localStorage` key — identity comes from `GET /api/auth/session`, since the JWT cookie is httpOnly. Header comment records that pgp identities are out of scope.
- [x] Static role → permission map defined with all five named permissions; `admin ⊇ user` by construction (set union, property-tested).
- [x] `usePermission()` implemented, handles a null identity cleanly; the server-side `hasPermission` reads the same map, and the client is served the resolved permission set rather than re-deriving it.
- [x] Grep test confirms no direct `role ===` comparison at any call site — automated in `permissions.test.ts`, not a pre-PR ritual.
- [x] Baseline migration sets every existing user to `user`; idempotent; reversible; rollback run and re-applied on local.
- [x] Admin list supplied via `OFFERGUIDE_ADMIN_EMAILS` or `--emails=`, not committed; unknown addresses warn without aborting the run.
- [x] README documents how to promote a user to admin, and the 26 → 30 operation count is corrected.
- [x] Interim admin gate fully deleted — code and `.env.local`. A test asserts no executable code reads `OFFERGUIDE_ADMIN_TOKEN` or `x-og-admin-token`. (**[~]** no `.env.example` exists. **Still to do: remove it from Vercel.**)
- [x] **[~]** All **30** admin operations reject no-credential, guest, and `user`-role JWT; succeed for `admin`. Enumerated in `adminGate.test.ts` (120 assertions) and spot-verified live.
- [x] Scoring-version immutability and master-consent-toggle 409 still enforced — `contract.test.ts` and `adminCrud.test.ts` both green after the swap.
- [x] `openapi.yaml` scheme rewritten and renamed `AdminToken` → `AdminAuth` across all 30 `security:` declarations; README's "26-operation" line corrected.

**Epic 9.2 — nav**
- [x] 3-tier nav renders correctly for guest, authenticated and admin, with no hydration flash of higher-tier items — verified in the browser at both viewports. See §8.3 for how "no flash" was satisfied.
- [x] Sprint 2 plain "Offer Guide" entry replaced, not duplicated — pinned by a test.
- [x] **[~]** Every nav surface renders from one declaration — `ModernHeader`'s desktop bar and mobile drawer now filter the same list. (No Sidebar exists; `nav/Header.tsx` is dead — §0.8.)
- [x] Visibility is data-driven; no `if (role === ...)` in any nav component, asserted by test.
- [x] Existing portal nav entries appear exactly as they do today — same six links, same groups, same order.
- [x] Admin tier wired to `/api-docs`, with its public status recorded in the declaration itself (D-3).

**Epic 9.3 — regression**
- [x] **[~]** [`OFFERGUIDE_SPRINT9_AUTH_REGRESSION.md`](OFFERGUIDE_SPRINT9_AUTH_REGRESSION.md) written, with §0.9's absent subjects recorded as findings rather than passes. Part A automated (62 checks, green); Part B needs real credentials and is yours to run.
- [x] OfferGuide full guest path completes post-migration — SCR-001 → SCR-010 automated in Part A §5, green.
- [x] `npm test` green — **538 tests, 18 files** (from 297/13 at sprint start).
- [ ] **Run Part A once more after the production migration and diff it against the pre-migration run.** A single green run shows the end state, not the absence of a regression.
- [ ] Part B (manual, credentials) completed.
- [ ] Sign-off recorded.

---

## PART 4 — SCOPE

### 4.1 Out of scope (unchanged from handoff §6)

Full RBAC / permission management UI · migrating legacy features to `middleware.ts` ·
migrating existing features onto `AuthProvider` · the admin portal / dashboard · any
role-management API endpoint · a fourth role · retrofitting naming conventions ·
the remaining Sprint 8 deferred items.

### 4.2 Raised by this review — add to the §7 backlog

1. **Plaintext passwords on `sanjeedausers`.** `/api/auth` stores and compares them in
   the clear. Needs a bcrypt migration with a verify-on-login-and-rehash rollout.
   **Highest-severity item found; it is not RBAC, so it is not this sprint — but it
   should be the next one.**
2. **Legacy features have no API authentication at all** (§0.4). The existing backlog
   item "migrate legacy routes to `middleware.ts`" has no subject; the real item is
   "add authentication to PP, CRR, Blogs and the khudi endpoints".
3. **Two identity systems.** `sanjeedausers` (MySQL) and the pgp Mongo user
   collections are unrelated, each with its own JWT and its own notion of role.
   Unifying them, or deliberately not, is an architectural decision that needs making.
4. **`users` vs `sanjeedausers`.** Two near-identical tables exist; only
   `sanjeedausers` is used. Confirm `users` is dead and drop it.
5. **`NAMING_CONVENTIONS.md`, `API_SETUP_GUIDE.md` and the Project Charter are not in
   the repository** despite being cited as binding across three sprints. Add them or
   stop citing them.
6. **`/api-docs` is public** (D-3).
7. **No OfferGuide history screen** backs `offerguide.history.view` (§0.10).
8. Carried over from Sprint 8: `schema.prisma` header cleanup, SCR-002 FRS cleanup,
   HelpIcon retrofit for SCR-001…007, the Sprint 8 `/docs` vs `/api-docs` correction,
   and the deferred QA set.

---

## PART 5 — PHASE 0 IMPLEMENTATION RECORD

### 5.1 Changes

| File | Change |
|---|---|
| [`src/lib/portal/users.ts`](src/lib/portal/users.ts) | **New.** `userIdOf()` — reads the `sanjeedausers` primary key under either column name, returning `null` for anything that is not a positive integer. |
| [`src/lib/portal/session.ts`](src/lib/portal/session.ts) | **New.** The client half of the session: one storage key, `storePortalToken` / `readPortalToken` / `logoutPortalSession`, all storage access wrapped for browsers that throw on it. |
| [`src/lib/offerguide/identity.ts`](src/lib/offerguide/identity.ts) | `PORTAL_COOKIE_NAME`; `verifyToken()` now demands a **positive integer** `id`; precedence is bearer → portal cookie → guest cookie → null; `setPortalCookie` / `clearPortalCookie` added. |
| [`src/app/api/auth/route.ts`](src/app/api/auth/route.ts) | Login and Google login read the key via `userIdOf()` and **500 loudly** rather than minting a claimless token; all three success paths set the portal cookie; `action: "logout"` added. |
| [`src/app/components/GoogleLoginButton.tsx`](src/app/components/GoogleLoginButton.tsx) | Removed the dead `POST /api/google-login` exchange (that route does not exist, so it 404'd on every sign-in) and with it the portal's second JWT storage key. |
| [`src/app/auth/page.tsx`](src/app/auth/page.tsx) | Writes the token through `storePortalToken()` instead of a raw `localStorage.setItem`. |
| `identity.test.ts`, `users.test.ts` | **New.** 40 tests. |

### 5.2 Verification

- `npx tsc --noEmit` — clean.
- `npm test` — **337 passed, 15 files** (up from 297/13; no pre-existing test changed).
- Live, against `next dev`:

  | Request | Result |
  |---|---|
  | `POST /api/auth {action:"logout"}` | 200, `portalToken` returned with `Max-Age=0` |
  | `GET /candidate-profile`, no credentials | 404 + a freshly minted `guestToken` — guest path unchanged |
  | `GET /candidate-profile`, `portalToken` cookie with `id: 4242` | server resolved `{ type: 'user', userInfoId: 4242 }`, **no** guest cookie minted |
  | `GET /candidate-profile`, token signed with no `id` claim | server resolved `{ type: 'guest' }` — falls through, does not 401 |
  | `POST /claim-guest-profile`, claimless bearer | 401 |
  | `POST /claim-guest-profile`, bearer with a real `id` | 200 — **the case that could not succeed before this phase** |

### 5.3 Found while implementing

- **A `null` id claim authenticated as user 0.** The first cut of `verifyToken` used
  `Number.isInteger(Number(payload.id))`; `Number(null)` is `0`, which is an integer.
  A token carrying `id: null` would have resolved to user 0 — an account
  `sanjeedausers` can never hold, so nothing would have surfaced it. Caught by a unit
  test, fixed by requiring a positive integer. The same hole swallowed `""`.
- **`GoogleLoginButton` was posting to a route that does not exist.** `/api/google-login`
  has never been implemented; the fetch 404'd every time and the real exchange happened
  in the parent's `onSuccess`. The dead branch was the only writer of the `token`
  storage key, so removing it resolved the duplicate-key item for free.
- **`userIdOf` deliberately reads both column names.** Local is `user_id`. Production is
  unverified (§0.2's pre-check was not run). A `SELECT user_id AS id` that guessed wrong
  would take login down entirely; reading both degrades instead. Collapse it once
  production is confirmed.
- **Next 16 permits one dev server per project** (`.next/dev/lock`). A dev server started
  before these edits served a stale Turbopack module graph and reported
  `clearPortalCookie is not a function` — a cache artifact, not a defect. Restart the dev
  server after pulling this change.

---

## PART 6 — PHASE 1 IMPLEMENTATION RECORD

### 6.1 Changes

| File | Change |
|---|---|
| [`src/lib/portal/permissions.ts`](src/lib/portal/permissions.ts) | **New.** `ROLES`, `PERMISSIONS`, `ROLE_PERMISSIONS`, `hasPermission()`, `permissionsFor()`, `normalizeRole()`. The whole access model. |
| [`src/lib/portal/identityRole.ts`](src/lib/portal/identityRole.ts) | **New.** `loadPermissionIdentity()` — reads the stored role through Prisma, fails closed on a missing row or a database error. |
| [`prisma/schema.prisma`](prisma/schema.prisma) | Hand-written read-only `UserInfo` model, `@@map("sanjeedausers")`, no relation to `CandidateProfile`. No `db pull` was run, so the file's `//` comments survive. |
| [`prisma.config.ts`](prisma.config.ts) | `sanjeedausers` **stays external**, now with the verified reason recorded. |
| [`scripts/migrate-roles.mjs`](scripts/migrate-roles.mjs) | **New.** Adds the column, baselines, promotes admins. `--check`, `--rollback`, `--prod`. |
| [`README.md`](README.md) | How to promote an admin; 26 → 30 operation count corrected. |
| [`tailwind.config.ts`](tailwind.config.ts) | Excluded `src/generated/**` from the content globs — see §6.6. |
| `permissions.test.ts` | **New.** 25 tests including the DoD's grep check. |

### 6.2 Design decisions taken

- **Sets composed, not listed.** `ROLE_PERMISSIONS` is built by accumulating
  public → user → admin, so `admin ⊇ user ⊇ public` holds structurally. The handoff
  names the inverse as a bug to never write; composition makes it unwritable rather
  than merely tested for. Property tests assert it for permissions added later.
- **An unrecognised stored role degrades to `user`, never `admin`.** The column is an
  unconstrained VARCHAR, so a typo, a legacy value, or a role a future build knows and
  this one does not are all reachable. `"Admin"` granting admin would be privilege
  escalation via capitalisation.
- **The role is read from the database, not carried as a JWT claim.** Tokens live an
  hour; a claim would keep a demoted admin working for up to an hour after the demotion,
  and would be asserted by the signer rather than by the table that owns the fact. 30
  low-traffic operations do not justify trading that away.
- **The grep check is a test, not a pre-PR step.** The DoD asks for a grep before opening
  the PR. A test catches the comparison somebody adds in a year, when nobody remembers
  the ritual.

### 6.3 The significant finding: Prisma would have dropped the password column

The plan said to take `sanjeedausers` off `tables.external` so Prisma could own the
`role` migration. **That is wrong, and it is destructive.** With the table off the
list, `prisma migrate diff` proposes:

```sql
DROP INDEX `email` ON `sanjeedausers`;   -- and email_2, email_3, email_4
ALTER TABLE `sanjeedausers` DROP COLUMN `google_id`,
    DROP COLUMN `password`,
    DROP COLUMN `reset_code`,
    DROP COLUMN `reset_code_expiry`,
    ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'user',
    MODIFY `user_id` INTEGER NOT NULL, …
```

Because `UserInfo` deliberately models only the four columns permission checks need,
Prisma reads the other four as columns to remove. A `prisma migrate dev` in that state
destroys every portal credential.

**Resolution:** the table stays external — which is what makes the read-only model safe
rather than contradictory, since external governs DDL, not reads — and the `role`
column is added by `scripts/migrate-roles.mjs` instead. This is also what the handoff
asked for in the first place: *"The role column itself is added by a plain SQL
migration, following the precedent set by the Sprint 1 bcrypt migration."* With the
table external again, `migrate diff` reports an empty migration.

### 6.4 Verification

- `npm test` — **362 passed, 16 files** (up from 337/15).
- `npx tsc --noEmit` — clean. *(It first reported three errors in
  `.next/dev/types/routes.d.ts`; that file had been corrupted by the running dev server
  writing a duplicated block. Deleting `.next/dev/types` cleared it. Not source.)*
- `npx eslint src/lib/portal scripts/migrate-roles.mjs` — clean.
- `prisma migrate diff --from-config-datasource --to-schema` — *"This is an empty
  migration."*
- Against the local database:

  | Step | Result |
  |---|---|
  | `--check` | Reported PK `user_id`, 5 accounts, column absent. Wrote nothing. |
  | First run | Column added; 5 accounts baselined to `user`; warned that no admin exists |
  | Second run | Column skipped, 0 rows baselined, identical final state — **idempotent** |
  | `--rollback` then re-run | Column dropped and re-added cleanly — **reversible** |
  | `--emails=<real>,<bogus>` | Real address promoted; bogus one warned and did **not** abort the run |
  | Re-run same `--emails` | `already admin — skipping`; final state unchanged |
  | Prisma read | `prisma.userInfo.findUnique` returns `{ userInfoId, role }` from the external table |
  | `loadPermissionIdentity(999999)` | `null` → `portal.admin.access` false, `offerguide.wizard.use` true |

### 6.5 Second finding: `prisma generate` took the whole site down

After regenerating the client, every route 500'd. The cause was not the schema change:

```
./src/app/globals.css — Error evaluating Node.js code
ENOENT: no such file or directory, stat '…/src/generated/prisma/internal/class.ts'
  at resolveChangedFiles (tailwindcss/lib/lib/content.js:236:36)
```

`tailwind.config.ts` scanned `./src/**/*.{js,ts,jsx,tsx}`, which includes the generated
Prisma client. `prisma generate` rewrites that directory, invalidating Tailwind's cached
file list; its content watcher then `statSync`s a path that no longer exists and throws
out of `globals.css` — so every page fails, and only a dev-server restart clears it.

Fixed at the root by excluding `!./src/generated/**` from the content globs. Tailwind
was scanning thousands of generated files with no class names in them, so this is also
a straight build-time win. **This bug predates Sprint 9** — anyone who ran
`prisma generate` with the dev server up would have hit it.

### 6.6 RESOLVED — production's primary key was `id`, and local was wrong

**§0.2's open question, answered 2026-09-02**, by running
`node scripts/migrate-roles.mjs --prod --check` against TiDB:

```
[migrate-roles] target: PRODUCTION — SanjeedaDB at gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000
[migrate-roles] primary key: id
[migrate-roles] columns: id, name, email, password, google_id, reset_code, reset_code_expiry, created_at
[migrate-roles] accounts: 7
```

The databases had genuinely diverged:

| | local | production |
|---|---|---|
| Primary key | `user_id` | **`id`** |
| `created_at` | absent | present |

**This would have broken admin in production entirely.** `schema.prisma` mapped
`UserInfo.userInfoId` to `user_id`, so Prisma would have selected a column that does not
exist on TiDB. Every role read throws, `loadPermissionIdentity` catches and returns null,
and `hasPermission` then treats every caller as the public tier — so **every admin would
have been denied**. Fail-closed, so not a security hole, but the admin API would have been
unusable and the cause would have looked like a permissions bug rather than a column name.

**Resolution: local was aligned to production, not the reverse.** Production is the source
of truth — 7 live accounts — and renaming its primary key would be riskier and pointless.

1. `ALTER TABLE sanjeedausers CHANGE COLUMN user_id id INT NOT NULL AUTO_INCREMENT` on
   local. All 5 rows kept their ids and roles; no inbound foreign keys existed.
2. `schema.prisma` now maps `@id @map("id")`, with the verification date recorded.
3. `prisma generate`; `migrate diff` reports an empty migration.
4. Prisma role reads verified working against the renamed column.

`userIdOf()` in [`users.ts`](src/lib/portal/users.ts) reads `user_id ?? id`, which is why
**login kept working on both databases throughout** — that tolerance was written into
Phase 0 precisely because this divergence was suspected but unconfirmed.

The staleness check that missed this is also fixed: `migrate-roles.mjs` used to hardcode
`user_id` as the expected key. It now parses the real `@map` out of `schema.prisma`, so
the comparison cannot go stale after the schema is corrected.

### 6.7 Open

- **Production still has no `role` column and no admin.** `--check` confirms the migration
  is ready to run; nothing has been written there yet.
- **`created_at` exists in production but not locally.** Harmless — the table is external
  and `UserInfo` does not model it — but the two databases are still not identical.
- **The local database now has one admin** (`conductivityhrconsultant@gmail.com`), so
  Phase 3's gate has something to test against. Production has none until the script is
  run there; until then `/admin/config/*` is unreachable by anyone, which the script
  warns about on every run.

---

## PART 7 — PHASES 2 & 3 IMPLEMENTATION RECORD

### 7.1 Changes

| File | Change |
|---|---|
| [`src/proxy.ts`](src/proxy.ts) | **New.** Centralized verification. Strips inbound identity headers, resolves the three states, forwards the result. |
| [`src/lib/portal/identityHeaders.ts`](src/lib/portal/identityHeaders.ts) | **New.** The proxy→handler contract: `stripIdentityHeaders`, `applyIdentityHeaders`, `readIdentityHeaders`. |
| [`src/lib/offerguide/adminAuth.ts`](src/lib/offerguide/adminAuth.ts) | Rewritten. `async`, role-based, fails closed. The env-token gate is gone. |
| [`src/lib/portal/identityRole.ts`](src/lib/portal/identityRole.ts) | Prisma import made lazy — see §7.4. |
| `adminCrud.ts` + 4 hand-written admin routes | `await requireAdmin(req)` at all 10 call sites. |
| [`public/openapi.yaml`](public/openapi.yaml) | `AdminToken` → `AdminAuth`, apiKey → bearer JWT, description rewritten, tag description updated. 30 declarations. |
| `.env.local` | `OFFERGUIDE_ADMIN_TOKEN` removed. |
| `adminAuth.test.ts`, `adminGate.test.ts`, `adminCrud.test.ts`, `contract.test.ts` | Rewritten/updated for the real gate. |
| `identityHeaders.test.ts` | **New.** The forgery tests. |

### 7.2 Verification

- `npm test` — **522 passed, 17 files** (up from 362/16). `tsc` and `eslint` clean.
- Live, against `next dev`, all 12 checks passing:

  | Request to `/api/offerguide/admin/config/questions` | Result |
  |---|---|
  | No credentials | 401 |
  | `guestToken` cookie only | 401 |
  | Valid JWT, `user`-role account | 401 |
  | Valid JWT, `admin`-role account | **200** |
  | Admin via `portalToken` cookie | **200** |
  | Old `x-og-admin-token` header | 401 — the interim gate is really gone |
  | **Forged `x-og-user-role: admin`** | **401** |
  | **Forged role alongside a real user JWT** | **401** |
  | Public config read, no credentials | 200 — guest path untouched |
  | Candidate profile as guest | 404 empty state |
  | OfferGuide wizard page as guest | 200 |
  | Expired token on a `guestOrAuth` route | 404, not 401 — falls through |

### 7.3 The significant finding: `export const runtime` silently 404s every matched route

The plan said middleware needs `export const runtime = "nodejs"`, because `jsonwebtoken`
cannot load on Edge. Both halves of that turned out to be wrong for Next 16:

1. **The convention was renamed.** `middleware.ts` → `proxy.ts`, and the exported function
   must be `proxy` (or a default export). The old name still loads, with a deprecation
   warning.
2. **Proxy already defaults to the Node runtime** as of Next 16.0.0 — so the Edge problem
   the plan worried about does not exist.
3. **Setting `runtime` in a proxy file throws.** From the docs: *"The `runtime` config
   option is not available in Proxy files. Setting the `runtime` config option in Proxy
   will throw an error."*

The failure mode is what makes this worth recording: it does not surface as an error.
**Every matched route returns 404** — including routes that had been returning 200 a
minute earlier — which reads exactly like a routing or matcher mistake. The proxy still
appears in the request timings, so it looks like it is running fine. Isolating it took
disabling the file entirely and watching the 404s become 200/401.

### 7.4 Also found

- **Importing `adminAuth` began requiring a configured database.** `@/lib/db/prisma`
  builds its adapter at module scope and throws when the DB env vars are missing, so
  adding the role lookup broke three unit-test files that have no database and never
  touch one. Fixed by importing Prisma lazily inside `loadPermissionIdentity`, which
  also means a guest request — which returns before the lookup — never constructs a
  client at all.
- **A mock that ignored its argument hid three real passes.** The first cut of
  `adminAuth.test.ts` stubbed `loadPermissionIdentity` to resolve `admin` unconditionally,
  so expired and wrong-secret tokens appeared to be admitted. They were not — the token
  had already been reduced to `null` upstream — but the mock could not show that. It now
  honours the real contract: a null id yields a null identity.
- **`AdminToken` → `AdminAuth` was not cosmetic.** `contract.test.ts` infers each
  operation's auth mode from its security scheme name. Since adminAuth and bearerAuth are
  now the *same credential*, separated only by the account behind it, the scheme name is
  the only thing that still distinguishes them.
- **A trailing-space role is not a bug.** `"admin "` in a header arrives as `"admin"`
  because the Headers API trims values. The test asserting it should be rejected was
  wrong, not the code.

### 7.5 Open

- **`OFFERGUIDE_ADMIN_TOKEN` still has to be removed from the Vercel project config.**
  Nothing reads it any more, so it is inert rather than dangerous, but the DoD asks for
  it gone.
- **Phase 6 (the regression checklist) is not started.**

---

## PART 8 — PHASE 4 IMPLEMENTATION RECORD

### 8.1 Changes

| File | Change |
|---|---|
| [`src/app/api/auth/session/route.ts`](src/app/api/auth/session/route.ts) | **New.** `GET` returns the caller's tier and resolved permission set. Never errors — a guest gets a 200 with the public set. `private, no-store`. |
| [`src/lib/portal/AuthProvider.tsx`](src/lib/portal/AuthProvider.tsx) | **New.** Single client-side identity source, plus `logout()` and `refresh()`. Accepts an optional `initialIdentity` for a future server-resolved render. |
| [`src/lib/portal/usePermission.ts`](src/lib/portal/usePermission.ts) | **New.** `usePermission()` and `usePermissionFilter()`. |
| [`src/lib/portal/navSections.ts`](src/lib/portal/navSections.ts) | **New.** The one nav declaration; every entry names its permission. |
| [`src/app/components/nav/ModernHeader.tsx`](src/app/components/nav/ModernHeader.tsx) | Renders from the declaration; both passes share one filtered list. Log in ↔ Log out. |
| [`src/app/layout.tsx`](src/app/layout.tsx) | `AuthProvider` wraps the portal. |
| `navSections.test.ts` | **New.** 16 tests. |

### 8.2 Verification

- `npm test` — **538 passed, 18 files**. `tsc` and `eslint` clean.
- 28 live checks across Phases 2–4, all passing.
- In the browser, as a **guest**: nav shows the four Explore links and "Log in"; no
  `My Evaluations`, no `API Contract`.
- After presenting an **admin** token: `My Evaluations` and `API Contract` appear and the
  control becomes "Log out". Mobile drawer shows Explore / Services / **Your account**
  with the same entries.
- Clicking **Log out** in the real UI drops the nav back to the guest tier and
  `/api/auth/session` returns `authenticated: false` — confirmed by polling, not a
  fixed delay.

### 8.3 How "no hydration flash" was satisfied — and the trade-off taken

The DoD says: *"A guest must never briefly see admin or authenticated links before the
client resolves identity."*

`AuthProvider` starts at the **public tier** and only ever widens. A guest's nav
therefore never contains a higher-tier entry at any point — the criterion is satisfied
by construction, and the server-rendered HTML proves it: requesting `/` **with an admin
cookie** still ships the guest nav, because the layout is static and the upgrade happens
client-side.

The alternative was reading the cookie in the root layout so the server could render the
correct tier immediately. **Rejected deliberately:** the root layout wraps every page in
the portal, and calling `cookies()` there opts the *entire site* out of static rendering.
That is a time-to-first-byte cost paid by every visitor — overwhelmingly guests, who
would see identical output — traded for removing a brief nav expansion that only
signed-in users ever see. It also fails safe: if the session request never lands, the nav
stays public rather than breaking.

What an admin sees is their extra links appearing shortly after load. That is the
opposite, safe direction, and it is not what the criterion forbids.

If a future admin dashboard makes instant tier resolution matter more than static
rendering, the switch is one step: resolve identity in a server component and pass
`initialIdentity` to the provider, which already accepts it.

### 8.4 Decisions worth knowing

- **The session endpoint returns permissions, not just a role.** The client never owns a
  second copy of the role→permission map, so a stale bundle cannot disagree with the
  server about what "admin" means, and adding a permission stays a one-file change.
- **No new `localStorage` key**, per the DoD. Identity comes from the httpOnly cookie via
  the session endpoint. The existing `authToken` copy is untouched.
- **Every nav entry names a permission, including public ones.** An "always visible"
  escape hatch is the thing that erodes; requiring a permission on every entry forces each
  new one to answer "who is this for?". The public tier holds `offerguide.wizard.use`, so
  guests see those entries.
- **`My Evaluations` points at `/offerguide`** because no history screen exists yet
  (§0.10). The tier is real and exercised rather than theoretical; the entry gets a
  destination when the screen ships.

### 8.5 Found while implementing

- **A wrapping "Log out" button.** Visible only in the screenshot — the auth control had
  no `whitespace-nowrap` and the longer label broke onto two lines once the nav grew by
  two entries. Fixed with `shrink-0 whitespace-nowrap` on both states.
- **A probe that looked like a logout bug.** Clicking Log out appeared to leave
  `/api/auth/session` returning `authenticated: true`. It was the test's fixed 1200 ms
  wait racing the in-flight request, not a defect — re-running with a poll showed a clean
  admin → guest transition every time. Worth recording because "logout leaves the session
  alive" is exactly the kind of thing worth being sure about.

---

## PART 9 — PHASE 6 IMPLEMENTATION RECORD

### 9.1 Changes

| File | Change |
|---|---|
| [`scripts/auth-regression.mjs`](scripts/auth-regression.mjs) | **New.** 62 automated checks across eight sections. |
| [`OFFERGUIDE_SPRINT9_AUTH_REGRESSION.md`](OFFERGUIDE_SPRINT9_AUTH_REGRESSION.md) | **New.** The record: Part A automated, Part B manual, Part C deployment, sign-off. |

### 9.2 Result

**62 passed, 0 failed.** Every legacy feature page logged-out and logged-in, session
behaviour end to end, the complete OfferGuide guest path SCR-001 → SCR-010, guest→account
claiming, the admin surface's four credential cases plus forgery, and the public reads.

The script authenticates by minting tokens with the portal secret rather than logging in.
That is the only way to exercise an authenticated session without handling a password,
and it is why it never creates accounts or submits credentials to simulate a login.
Everything needing a real password stays manual in Part B.

### 9.3 Found while building it

Both were corrections to the harness, not defects in the application — recorded so the
next person does not re-derive them:

- `POST /offers/{id}/compute-score` returns **201**, not 200. It persists the score; the
  contract separates it from `GET ../score` precisely because it has a side effect.
- `GET /config/questions` **requires** `?screen=`. A 400 without one is correct, and the
  script now asserts that too.
- **PP has no route.** `src/app/PP/` is a component library with no `page.tsx`, consumed
  by `/khudiassessment` and `/Readiness-Report`. Those stand in for it, recorded rather
  than silently skipped.

### 9.4 The one thing a green run does not prove

A single passing run shows the end state. It does **not** show that the role migration
changed nothing — for that, Part A has to run **before and after** the production
migration and the two outputs diffed. That is the remaining Epic 9.3 item, and it can
only be done at deploy time.

---

## SPRINT STATUS

| Epic | State |
|---|---|
| Phase 0 — session repair *(added; not in the handoff)* | ✅ Complete |
| 9.1.1 — centralized JWT verification | ✅ Complete (`src/proxy.ts`) |
| 9.1.2 — role column, AuthProvider, usePermission | ✅ Complete |
| 9.1.3 — baseline migration and admin assignment | ✅ Complete (local; production pending) |
| 9.1.4 — real adminAuth replaces the interim gate | ✅ Complete |
| 9.2.1 — 3-tier permission-aware nav | ✅ Complete |
| 9.3.1 — auth & session regression | ◐ Automated portion complete; manual + before/after diff pending |

**Tests: 297 → 538. Typecheck and lint clean.**

Remaining, all requiring access or credentials I do not have:

1. Run `node scripts/migrate-roles.mjs --prod --check`, then the real migration.
2. Re-run `scripts/auth-regression.mjs` against production and diff against the
   pre-migration run.
3. Complete Part B of the regression record (real logins, Google, password reset).
4. Remove `OFFERGUIDE_ADMIN_TOKEN` from the Vercel project environment.
5. Sign off.
