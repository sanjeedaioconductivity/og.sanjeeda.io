# sanjeeda.io

Career services portal. Next.js (App Router), MySQL via Prisma, MongoDB via
Mongoose for configuration data.

## Getting started

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Vitest suite (unit + contract verification) |
| `npm run lint` | ESLint |

## API documentation

The full API contract lives in [`public/openapi.yaml`](public/openapi.yaml) and
renders as Swagger UI at **`/docs`** (also mounted at `/api-docs`). It is
hand-authored — there is no JSDoc generation step, so a new route means a new
entry in that file. `src/lib/offerguide/contract.test.ts` fails the build if the
two ever drift apart in either direction.

---

# OfferGuide — known limitations

These are current, accepted limitations of the OfferGuide module as it ships.
They are stated here rather than buried in code comments so that anyone
operating or extending the module finds them first.

### Guest data has no automatic expiry

A candidate can complete the entire wizard without an account; their answers are
tied to a `guestToken` httpOnly cookie and stored in `candidate_profiles`. That
data has **no TTL and is never automatically removed**. This is deliberate — a
guest who returns weeks later still finds their evaluation — but it means guest
rows accumulate indefinitely and need a retention policy before they become a
compliance question.

Note the asymmetry: `WizardDraft` (the autosaved in-progress answers, in Mongo)
*does* carry a 30-day TTL index. The draft expires; the profile it was drafting
does not.

### Cross-device registration orphans guest history

`POST /claim-guest-profile` links a guest profile to a newly registered account
by reading the `guestToken` cookie from the same browser. A candidate who
evaluates offers on their phone and then registers on their laptop has no cookie
to link, so the guest profile stays unlinked and their history is effectively
lost to them. **There is no email-based linking.** The endpoint reports this
outcome in its response `message` rather than failing.

### The admin config surface

The six admin-editable Mongo collections (`OgQuestions`, `OgScoringConfig`,
`OgGeography`, `OgMarketBenchmarks`, `OgFunctionalDomains`, `OgConsentToggles`)
are edited at **`/offerguide/admin`** (Sprint 10) — a permission-gated UI for
each collection, with a golden-fixture preview before a scoring version is
activated. The same operations remain available through Swagger, `curl`, or a
script for raw access. Everything under `/admin/config/*` is a **32-operation**
surface (30 through Sprint 9, plus the scoring `activate` and `preview` endpoints
Sprint 10 added) intended for operators, not end users.

### One codebase, two domains — the OfferGuide nav entry

The same deployment code serves two sites:

| Domain | Advertises OfferGuide in the header |
|---|---|
| `sanjeeda.io` — the main portal | **no** |
| `og.sanjeeda.io` — the OfferGuide site | **yes** |

That is a build-time flag, not a code difference:

```
NEXT_PUBLIC_SHOW_OFFERGUIDE=true      # set ONLY on the og.sanjeeda.io project
```

Unset or anything else hides it. **Defaulting to hidden is deliberate** — forgetting
the flag on `og.sanjeeda.io` loses a link someone notices immediately, whereas the
other default would silently put the tab back on the main portal, which is the exact
thing this exists to prevent.

Set it in `.env.local` if you are working on OfferGuide locally and want the header
link. `/offerguide` stays a public route either way — the flag only controls whether
the header advertises it.

This replaced a branch (`v2-no-offerguide-link`) that was kept permanently different
by exactly those few lines, which meant every change had to be merged twice and the
branches drifted apart unnoticed. `navSections.test.ts` pins both shapes.

### Managing admins — there is no UI, use the script

Roles are set by script and operational action only. There is no self-service
promotion, no admin UI, and **no API endpoint that changes a role** — deliberately
(Sprint 9 §6), so nobody can escalate themselves. `/api-docs` is the API contract;
it does not show who the admins are.

**Everything you need is four commands:**

```bash
npm run admins                                        # who are the admins?
npm run roles -- --emails=someone@example.com         # add an admin
npm run roles -- --demote=someone@example.com         # remove an admin
npm run roles -- --list --prod                        # same, against production
```

Add `--prod` to any of them to target production instead of local, and `--check`
to preview a change without writing. Multiple addresses are comma-separated. The
admin list may also come from `OFFERGUIDE_ADMIN_EMAILS`; it is never hardcoded in
the script and never committed.

`--demote` **refuses to remove the last admin**, because that locks everyone out
of `/admin/config/*` and is only recoverable by running the script again — fine on
a laptop, an incident in production. Promote a replacement first, or pass `--force`
if you genuinely mean it.

The same script adds the `role` column and baselines every existing account to
`user` on first run. It is idempotent — running it twice produces the same result —
and reversible with `--rollback`, which drops the column and restores the exact
pre-migration state. Roll the application back too if you do that; it reads the
column.

### The admin gate is real RBAC (since Sprint 9)

`/admin/config/*` is protected by `requireAdmin`: a valid portal JWT whose
account's stored `role` is `admin`, resolved through the permission map
(`portal.admin.access`). The Sprint 5 interim `OFFERGUIDE_ADMIN_TOKEN` header
gate is gone. The gate fails closed — no token, an unreadable role, or a
database error all resolve to the public tier, which is not an admin. Roles are
assigned by script only (see "Managing admins" above); there is no self-service
promotion.

### Weighting layers ship at their defaults, untuned

The importance-slider layer (`offer_worklife_importance`,
`offer_growth_importance`, `offer_culture_importance`) and the
`evaluation_type` bonus layer are live infrastructure, wired end to end and
exercised by tests — but they ship at their **default settings with no
real-world tuning applied**. They are mechanisms waiting for data, not
calibrated weights. Retuning them is a new `OgScoringConfig` version, not a
deploy.

### Market intelligence has no community data yet

The SCR-009 market intelligence panel and the SCR-010 community insight card
render honest empty states ("not enough community data yet"). They are fed by
candidate-contributed consent data, which does not exist until candidates start
opting in. This is **not** the same source as `OgMarketBenchmarks`, which is
admin-maintained reference data and does drive a real Salary score — so a
correct build shows a real Salary score alongside an empty market intelligence
panel.

## Scoring

Scoring is configuration-driven. Category composition comes from each question's
own `category` field in `OgQuestions` — there is no field-to-category map in
code, so moving a question between categories is a document edit. Salary is the
exception: it uses a dedicated market-percentile formula against
`OgMarketBenchmarks` and never enters the generic averaging path.

Every `offer_scores` row records the `scoringConfigVersion` that produced it, and
config versions are immutable, so a stored score can always be traced back to
the exact weights behind it. Creating a new version never alters previously
computed scores.

`src/lib/offerguide/scoring/goldenFixtures.ts` holds five committed fixtures with
their expected output. Any change that moves those numbers fails
`goldenFixtures.test.ts` — intentionally, so the movement gets reviewed.
