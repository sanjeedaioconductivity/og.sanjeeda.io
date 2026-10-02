#!/usr/bin/env node
/**
 * Sprint 9, Epic 9.3 — automated portion of the auth & session regression.
 *
 * The portal's first auth regression record. Project Charter §8 names zero
 * regressions to existing modules as a success criterion, and Sprint 9 is the
 * only sprint that could plausibly break portal login, so the verification
 * belongs here rather than after it.
 *
 * WHAT THIS COVERS: everything that does not need a real password —
 * every legacy feature page logged-out and logged-in, the whole OfferGuide guest
 * path end to end, guest→account claiming, session persistence, and the admin
 * surface. Roughly 80% of the checklist.
 *
 * WHAT IT CANNOT COVER, and why: anything requiring real credentials. Logging in
 * with a password, Google sign-in, and the password-reset email round trip all
 * need a human. Those stay in OFFERGUIDE_SPRINT9_AUTH_REGRESSION.md as manual
 * checks. This script deliberately does NOT create accounts or submit passwords
 * to fake them.
 *
 * RUN IT TWICE — before the role migration and after — and attach both outputs
 * to the PR. Diffing them is the actual evidence that nothing regressed.
 *
 *   node scripts/auth-regression.mjs                     # against localhost:3000
 *   node scripts/auth-regression.mjs http://localhost:57372
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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

const BASE = process.argv[2] || "http://localhost:3000";
const SECRET = process.env.JWT_SECRET || "default_secret";

/**
 * Account ids to impersonate. These mint tokens directly with the portal secret
 * rather than logging in, which is the only way to exercise an authenticated
 * session without handling a password. Override when the local database differs.
 */
const USER_ID = Number(process.env.REGRESSION_USER_ID || 1);
const ADMIN_ID = Number(process.env.REGRESSION_ADMIN_ID || 3);

const userToken = jwt.sign({ id: USER_ID }, SECRET, { expiresIn: "1h" });
const adminToken = jwt.sign({ id: ADMIN_ID }, SECRET, { expiresIn: "1h" });

let pass = 0;
let fail = 0;
const failures = [];

function record(section, label, ok, detail) {
  console.log(`  ${ok ? "[PASS]" : "[FAIL]"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (ok) pass++;
  else {
    fail++;
    failures.push(`${section} :: ${label}${detail ? ` (${detail})` : ""}`);
  }
}

function section(title) {
  console.log(`\n## ${title}\n`);
  return title;
}

async function get(pathname, { cookie, bearer } = {}) {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  if (bearer) headers.authorization = `Bearer ${bearer}`;
  return fetch(`${BASE}${pathname}`, { headers, redirect: "manual", cache: "no-store" });
}

async function json(pathname, { method = "GET", cookie, bearer, body } = {}) {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  if (bearer) headers.authorization = `Bearer ${bearer}`;
  if (body) headers["content-type"] = "application/json";
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  let parsed = null;
  try {
    parsed = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  return { res, body: parsed, setCookie: res.headers.getSetCookie?.() ?? [] };
}

function cookieValue(setCookie, name) {
  const hit = setCookie.find((c) => c.startsWith(`${name}=`));
  if (!hit) return null;
  const value = hit.split(";")[0].slice(name.length + 1);
  return value || null;
}

console.log(`# OfferGuide Sprint 9 — auth & session regression`);
console.log(`\nTarget: ${BASE}`);
console.log(`Run at: ${new Date().toISOString()}`);
console.log(`Impersonating user id ${USER_ID} and admin id ${ADMIN_ID}.`);

/* ===================================================================== */
let s = section("1. Existing feature pages — logged OUT");

// The handoff names PP, pgp, CRR and Blogs. PP has no page.tsx of its own: it is
// a component library consumed by /Readiness-Report and /khudiassessment, so
// those stand in for it. Recorded rather than silently skipped.
const LEGACY_PAGES = [
  ["/", "home"],
  ["/CRR", "CRR"],
  ["/Blogs", "Blogs"],
  ["/pgp-access", "pgp entry"],
  ["/candidate", "pgp candidate login"],
  ["/mentor", "pgp mentor login"],
  ["/management", "pgp management login"],
  ["/khudiassessment", "khudi (uses PP components)"],
  ["/Readiness-Report", "readiness report (uses PP components)"],
  ["/FinancialOffer", "offer calculator"],
  ["/cv", "3D CVs"],
  ["/auth", "portal login page"],
  ["/api-docs", "swagger"],
];

for (const [route, label] of LEGACY_PAGES) {
  const res = await get(route);
  record(s, `${route} (${label})`, res.status === 200, `${res.status}`);
}

/* ===================================================================== */
s = section("2. The same pages — logged IN as a registered user");

for (const [route, label] of LEGACY_PAGES) {
  const res = await get(route, { cookie: `portalToken=${userToken}` });
  record(s, `${route} (${label})`, res.status === 200, `${res.status}`);
}

/* ===================================================================== */
s = section("3. Session behaviour");

{
  const guest = await json("/api/auth/session");
  record(s, "session endpoint answers a guest with 200, not 401", guest.res.status === 200);
  record(s, "guest is not authenticated", guest.body?.authenticated === false);

  const asUser = await json("/api/auth/session", { cookie: `portalToken=${userToken}` });
  record(s, "a portal cookie authenticates", asUser.body?.authenticated === true);
  record(s, "the user's own id comes back", asUser.body?.userInfoId === USER_ID);

  // Session persistence: the same cookie resolves identically on a later request.
  const again = await json("/api/auth/session", { cookie: `portalToken=${userToken}` });
  record(
    s,
    "session persists across requests",
    again.body?.userInfoId === asUser.body?.userInfoId && again.body?.role === asUser.body?.role
  );

  const loggedOut = await json("/api/auth", { method: "POST", body: { action: "logout" } });
  const cleared = loggedOut.setCookie.some(
    (c) => c.startsWith("portalToken=") && /Max-Age=0/i.test(c)
  );
  record(s, "logout returns 200 and expires the portal cookie", loggedOut.res.status === 200 && cleared);

  const expired = await json("/api/auth/session", {
    cookie: `portalToken=${jwt.sign({ id: USER_ID }, SECRET, { expiresIn: -10 })}`,
  });
  record(s, "an expired token resolves to guest, not an error", expired.body?.authenticated === false);

  const forged = await json("/api/auth/session", {
    cookie: `portalToken=${jwt.sign({ id: ADMIN_ID }, "wrong-secret")}`,
  });
  record(s, "a token signed with the wrong secret resolves to guest", forged.body?.authenticated === false);
}

/* ===================================================================== */
s = section("4. Auth endpoint contract (no credentials submitted)");

{
  const noAction = await json("/api/auth", { method: "POST", body: {} });
  record(s, "a request with no action is rejected", noAction.res.status === 400);

  const badAction = await json("/api/auth", { method: "POST", body: { action: "nonsense" } });
  record(s, "an unknown action is rejected", badAction.res.status === 400);

  const noPassword = await json("/api/auth", {
    method: "POST",
    body: { action: "login", email: "nobody@example.invalid" },
  });
  record(s, "login without a password is rejected", noPassword.res.status === 400);

  const unknownUser = await json("/api/auth", {
    method: "POST",
    body: { action: "login", email: "nobody@example.invalid", password: "x" },
  });
  record(s, "login for an unknown account 404s", unknownUser.res.status === 404);
}

/* ===================================================================== */
s = section("5. OfferGuide full guest path, SCR-000 → SCR-010, no account");

{
  const created = await json("/api/offerguide/candidate-profile", {
    method: "POST",
    body: { careerStage: "Mid-Level", preferredWorkArrangement: "Hybrid" },
  });
  const guestToken = cookieValue(created.setCookie, "guestToken");
  record(s, "SCR-001 creates a profile and mints a guestToken", created.res.status === 201 && !!guestToken);
  record(
    s,
    "the guest cookie is httpOnly",
    created.setCookie.some((c) => c.startsWith("guestToken=") && /HttpOnly/i.test(c))
  );

  const jar = `guestToken=${guestToken}`;

  const reread = await json("/api/offerguide/candidate-profile", { cookie: jar });
  record(s, "the guest reads their own profile back", reread.res.status === 200 && reread.body?.id === created.body?.id);

  const anonymous = await json("/api/offerguide/candidate-profile");
  record(s, "without the cookie the profile is NOT returned", anonymous.res.status === 404);

  const session = await json("/api/offerguide/evaluation-sessions", {
    method: "POST",
    cookie: jar,
    body: {
      evaluationType: "New job offer",
      evaluationOfferCount: "One offer",
      evaluationPriorities: ["Salary", "Growth"],
    },
  });
  record(s, "SCR-002 creates an evaluation session", session.res.status === 201, `${session.res.status}`);

  const sessionId = session.body?.id;
  const offer = sessionId
    ? await json(`/api/offerguide/evaluation-sessions/${sessionId}/offers`, {
        method: "POST",
        cookie: jar,
        body: {
          companyName: "Regression Co",
          roleTitle: "Engineer",
          offerWorkArrangement: "Hybrid",
          offerEmploymentType: "Full-time",
        },
      })
    : { res: { status: 0 }, body: null };
  record(s, "SCR-003 adds an offer", offer.res.status === 201, `${offer.res.status}`);

  const offerId = offer.body?.id;
  if (offerId) {
    const comp = await json(`/api/offerguide/offers/${offerId}/compensation`, {
      method: "PATCH",
      cookie: jar,
      body: { offerBaseSalary: "250000", offerPayPeriod: "Monthly", offerCurrency: "PKR" },
    });
    record(s, "SCR-004 saves compensation", comp.res.status === 200, `${comp.res.status}`);

    const score = await json(`/api/offerguide/offers/${offerId}/compute-score`, {
      method: "POST",
      cookie: jar,
    });
    // 201, not 200 — this operation persists the score, and the contract
    // separates it from GET ../score precisely because it has a side effect.
    record(
      s,
      "SCR-010 computes a score",
      score.res.status === 201 && typeof score.body?.overallScore === "number",
      score.body?.overallScore !== undefined
        ? `${score.res.status}, overall ${score.body.overallScore}`
        : `${score.res.status}`
    );
    record(
      s,
      "the score carries a recommendation label",
      typeof score.body?.recommendationLabel === "string" && score.body.recommendationLabel.length > 0,
      score.body?.recommendationLabel
    );
  } else {
    record(s, "SCR-004 saves compensation", false, "no offer to score");
    record(s, "SCR-010 computes a score", false, "no offer to score");
    record(s, "the score carries a recommendation label", false, "no offer to score");
  }

  // Cross-guest isolation: a different guest must not see this profile.
  const otherGuest = await json("/api/offerguide/candidate-profile", {
    cookie: `guestToken=${crypto.randomUUID()}`,
  });
  record(s, "another guest's cookie does not reach this profile", otherGuest.res.status === 404);

  /* --------------------------------------------------------------- */
  s = section("6. /claim-guest-profile links a guest to an account");

  const unauth = await json("/api/offerguide/claim-guest-profile", { method: "POST", cookie: jar });
  record(s, "rejects a guest with no account", unauth.res.status === 401);

  const claimless = await json("/api/offerguide/claim-guest-profile", {
    method: "POST",
    cookie: jar,
    bearer: jwt.sign({ name: "no id claim" }, SECRET),
  });
  record(s, "rejects a token carrying no id claim", claimless.res.status === 401);

  // The Phase 0 regression: this could not succeed for a login-issued token
  // before Sprint 9, because those tokens carried no id.
  const claimed = await json("/api/offerguide/claim-guest-profile", {
    method: "POST",
    cookie: jar,
    bearer: userToken,
  });
  record(s, "a real account claims the guest profile", claimed.res.status === 200, `${claimed.res.status}`);
}

/* ===================================================================== */
s = section("7. Admin surface");

{
  const ADMIN_PATH = "/api/offerguide/admin/config/questions";

  const anonymous = await get(ADMIN_PATH);
  record(s, "rejects no credentials", anonymous.status === 401, `${anonymous.status}`);

  const guest = await get(ADMIN_PATH, { cookie: `guestToken=${crypto.randomUUID()}` });
  record(s, "rejects a guest cookie", guest.status === 401, `${guest.status}`);

  const asUser = await get(ADMIN_PATH, { bearer: userToken });
  record(s, "rejects a registered user", asUser.status === 401, `${asUser.status}`);

  const asAdmin = await get(ADMIN_PATH, { bearer: adminToken });
  record(s, "admits an admin", asAdmin.status === 200, `${asAdmin.status}`);

  const interim = await get(ADMIN_PATH, { cookie: "" });
  const withOldHeader = await fetch(`${BASE}${ADMIN_PATH}`, {
    headers: { "x-og-admin-token": process.env.OFFERGUIDE_ADMIN_TOKEN || "any-old-token" },
  });
  record(s, "the removed interim token grants nothing", withOldHeader.status === 401, `${withOldHeader.status}`);
  void interim;

  const forged = await fetch(`${BASE}${ADMIN_PATH}`, {
    headers: {
      "x-og-identity-type": "authenticated",
      "x-og-user-info-id": String(ADMIN_ID),
      "x-og-user-role": "admin",
    },
  });
  record(s, "forged identity headers are stripped by the proxy", forged.status === 401, `${forged.status}`);
}

/* ===================================================================== */
s = section("8. Public reads still need no credentials");

for (const route of [
  "/api/offerguide/config/geography",
  // `screen` is required by the contract; without it the route 400s by design.
  "/api/offerguide/config/questions?screen=SCR-005",
  "/api/offerguide/config/functional-domains",
  "/api/offerguide/config/consent-toggles",
]) {
  const res = await get(route);
  record(s, route, res.status === 200, `${res.status}`);
}

{
  const noScreen = await get("/api/offerguide/config/questions");
  record(s, "/config/questions without ?screen is a 400, not a leak", noScreen.status === 400, `${noScreen.status}`);
}

/* ===================================================================== */
console.log(`\n${"=".repeat(60)}`);
console.log(`RESULT: ${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log(`\nFailures:`);
  for (const f of failures) console.log(`  - ${f}`);
}
console.log(`${"=".repeat(60)}`);

process.exit(fail ? 1 : 0);
