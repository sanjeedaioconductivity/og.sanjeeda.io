# OfferGuide — Sprint 9 Auth & Session Regression Record

**Epic 9.3, Story 9.3.1.** Project Charter §8 names zero regressions to existing
modules as a success criterion, and §9's mitigation calls for regression-testing
existing modules after each Phase A change. Sprint 9 is the only sprint that
could plausibly break portal login, so the verification belongs here rather than
after it.

**This is the portal's first auth regression record.** It becomes the baseline
the §7 legacy-migration follow-up is tested against, so it is worth being exact
about what was checked and what was not.

---

## How to run it

```bash
npm test
```

Then, with the dev server up:

```bash
node scripts/auth-regression.mjs
```

Pass a base URL as the first argument if the server is not on `:3000`. Override
`REGRESSION_USER_ID` / `REGRESSION_ADMIN_ID` if your database's account ids
differ from `1` and `3`.

**Run it twice — before the role migration and after it — and attach both
outputs to the PR.** Diffing the two runs is the actual evidence that the
migration changed nothing; a single green run only shows the end state.

---

## What is automated, and what cannot be

`scripts/auth-regression.mjs` covers **62 checks**: every legacy feature page
logged-out and logged-in, the complete OfferGuide guest path, guest→account
claiming, session persistence, the admin surface, and the public config reads.

It authenticates by **minting tokens with the portal's own secret**, not by
logging in. That is the only way to exercise an authenticated session without
handling a password, and it means the script never creates accounts or submits
credentials to fake a login. Everything that genuinely needs a password stays
manual, in Part B below.

---

## Part A — Automated

Latest run: **62 passed, 0 failed** (2026-08-31, local).

| § | Covers | Checks |
|---|---|---|
| 1 | Every existing feature page loads for a logged-out visitor | 13 |
| 2 | The same pages load for a registered user | 13 |
| 3 | Session: guest, authenticated, persistence, logout, expiry, forged secret | 8 |
| 4 | Auth endpoint contract — rejects malformed requests | 4 |
| 5 | OfferGuide guest path SCR-001 → SCR-010, plus cross-guest isolation | 10 |
| 6 | `/claim-guest-profile` — rejects a guest, rejects a claimless token, links a real account | 3 |
| 7 | Admin surface — the four credential cases, the removed interim token, forged headers | 6 |
| 8 | Public config reads need no credentials | 5 |

Two findings from building it, both corrections to the harness rather than
defects in the app, recorded so the next person does not re-derive them:

- `POST /offers/{id}/compute-score` returns **201**, not 200. It persists the
  score; the contract separates it from `GET ../score` precisely because it has a
  side effect.
- `GET /config/questions` **requires** `?screen=`. A 400 without one is correct
  behaviour, and the script now asserts that too.

### A note on "PP"

The handoff names PP, pgp, CRR and Blogs as the four features to regression-test.
**PP has no route of its own** — `src/app/PP/` is a component library (charts,
attribute scores, the results page) with no `page.tsx`. It is consumed by
`/khudiassessment` and `/Readiness-Report`, and those two stand in for it in §1
and §2. Recorded rather than silently skipped.

---

## Part B — Manual, requires real credentials

These cannot be automated without handling a real password, and should not be.
Run them in a browser against a dev server. **Tick both columns.**

| # | Check | Before migration | After migration |
|---|---|---|---|
| 1 | Log in with an existing account at `/auth` — succeeds | ☐ | ☐ |
| 2 | After login, the nav shows **Log out** and **My Evaluations** | ☐ | ☐ |
| 3 | Reload the page — still logged in (session persists) | ☐ | ☐ |
| 4 | Click **Log out** — nav returns to the guest tier | ☐ | ☐ |
| 5 | Reload after logout — still logged out | ☐ | ☐ |
| 6 | Sign up for a new account — succeeds, and lands logged in | ☐ | ☐ |
| 7 | Google sign-in (`google-login`) completes and logs you in | ☐ | ☐ |
| 8 | Password reset: `send-code` delivers an email with a 6-digit code | ☐ | ☐ |
| 9 | `verify-code` with that code sets a new password | ☐ | ☐ |
| 10 | Log in with the new password — succeeds | ☐ | ☐ |
| 11 | An **admin** account sees **API Contract** in the nav; a `user` account does not | ☐ | ☐ |
| 12 | pgp candidate / mentor / management logins each still work (separate Mongo identities) | ☐ | ☐ |
| 13 | Complete the OfferGuide wizard end to end as a guest in a private window | ☐ | ☐ |
| 14 | Register at the end of that wizard — the guest history carries into the account | ☐ | ☐ |

### Two of these cannot pass as the handoff words them

Recorded as findings, not as passes:

- **"The Sprint 1 bcrypt password path is unaffected."** There is no bcrypt on
  this path. `/api/auth` stores and compares **plaintext** passwords
  (`user.password !== password`). `bcryptjs` is used only by the three pgp Mongo
  endpoints. Check #10 therefore records that login still works, not that a hash
  still verifies. **This is a real security defect and the top backlog item** —
  see the plan's §4.2.
- **"Logout works unchanged."** There was no portal logout before Sprint 9;
  `authToken` was written on login and never removed. Checks #4 and #5 record a
  new baseline rather than confirming unchanged behaviour.

---

## Part C — Deployment

| # | Step | Done |
|---|---|---|
| 1 | `node scripts/migrate-roles.mjs --prod --check` — confirms the production primary key is `user_id` and reports what would change | ☐ |
| 2 | `node scripts/migrate-roles.mjs --prod --emails=…` — adds the column, baselines everyone to `user`, promotes the named admins | ☐ |
| 3 | Re-run Part A against production; diff against the pre-migration run | ☐ |
| 4 | Remove `OFFERGUIDE_ADMIN_TOKEN` from the Vercel project environment variables | ☐ |
| 5 | Confirm at least one admin exists — the script warns loudly when none does | ☐ |

**Rollback**, if needed: `node scripts/migrate-roles.mjs --prod --rollback` drops
the column and restores the pre-migration state. Roll the application back too —
it reads that column.

---

## Sign-off

| | Name | Date |
|---|---|---|
| Part A run before migration | | |
| Part A run after migration | | |
| Part B completed by | | |
| Part C completed by | | |
