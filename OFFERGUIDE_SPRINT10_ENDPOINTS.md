# OfferGuide — Sprint 10 Endpoints

**Status:** Draft. Companion to the Sprint 10 plan, FRS, UI/UX, and DB schema docs.

## Summary

Of the 30 existing `/admin/config/*` operations, **28 are reused completely unchanged**. **1 gets a validation addition** (Market Benchmarks). **2 are genuinely new** — and neither was fully specified in the original plan; this pass is what pins them down.

---

## Existing endpoints — reused as-is (28 operations)

All already `requireAdmin()`-gated, all already tested (`adminAuth.test.ts`, `adminCrud.test.ts`, per the earlier repo audit). No route file changes.

| Resource | Endpoints |
|---|---|
| Questions | `GET/POST /admin/config/questions`, `GET/PUT/DELETE /admin/config/questions/{fieldId}` |
| Geography | `GET/POST /admin/config/geography`, `GET/PUT/DELETE /admin/config/geography/{countryCode}`, `GET/POST /admin/config/geography/{countryCode}/cities`, `PUT/DELETE /admin/config/geography/{countryCode}/cities/{cityId}` |
| Functional Domains | `GET/POST /admin/config/functional-domains`, `GET/PUT/DELETE /admin/config/functional-domains/{domainId}` |
| Consent Toggles | `GET/POST /admin/config/consent-toggles`, `GET/PUT/DELETE /admin/config/consent-toggles/{toggleId}` |
| Scoring (read) | `GET /admin/config/scoring` (list all versions), `GET /admin/config/scoring/{version}` |

## Existing endpoint — validation added, not a new route (Market Benchmarks)

`POST /admin/config/market-benchmarks` and `PUT /admin/config/market-benchmarks/{id}` — **implementation choice: a Mongoose custom validator on `OgMarketBenchmarks.js` itself, not a change to `adminCrud.ts` or either route file.**

Why this is the right layer: `createItemHandlers`'s `PUT` already calls `findOneAndUpdate(..., {runValidators: true})`, and Mongoose's `.create()` runs schema validators by default — so a validator declared once on the schema is automatically enforced by both the existing generic POST and PUT handlers, with **zero code changes to `adminCrud.ts` or the route files.** Putting the rule in the generic CRUD factory instead would leak a Market-Benchmarks-specific rule into code shared by 4 other collections that don't need it.

```js
// OgMarketBenchmarksSchema, add to the existing fields:
p50: {
  type: Number,
  required: true,
  validate: {
    validator: function () { return this.p25 <= this.p50 && this.p50 <= this.p75; },
    message: "p25, p50, and p75 must be in ascending order.",
  },
},
```

Response impact: a violating POST/PUT now 400s via the existing generic catch (`badRequest(errorMessage(err))` in `adminCrud.ts` — already there, no change needed), with the message above surfaced instead of a raw Mongoose `ValidationError` dump. The client-side check from the UI/UX doc (inline as-you-type feedback) is the primary UX; this is the backstop that makes it a real guarantee regardless of client.

---

## New endpoints (2)

### 1. `POST /api/offerguide/admin/config/scoring/{version}/activate`

Already specified in Epic 10.2.2 — restating here as the formal contract entry:

- **Auth:** `requireAdmin()`, same as every other `/admin/config/*` route.
- **Request:** no body. Version is the path param.
- **Behavior:** one Mongo transaction — `updateMany({}, {isActive:false})` then `updateOne({version}, {isActive:true})`. Re-activating an already-active version is a no-op, still 200.
- **Response `200`:** the newly-active `OgScoringConfig` document.
- **Response `404`:** version doesn't exist.
- **Response `403`:** non-admin (matches existing `adminAuth` behavior everywhere else).

### 2. `GET /api/offerguide/admin/config/scoring/{version}/preview` — **not previously specified; this is the gap this pass closes**

The original plan (Epic 10.2.6) said the fixture-diff preview "reuses `goldenFixtures.ts` and `scoreOffer.ts` directly" without saying *how* — implying it might just be a client-side computation. It can't be: `scoreOffer()` is a pure function (confirmed — no DB imports), but it needs `OgQuestions`, `OgMarketBenchmarks`, and the target `OgScoringConfig` loaded first, and only server code can reach Mongo. So this needs its own read-only endpoint.

- **Auth:** `requireAdmin()`.
- **Request:** no body. `{version}` path param is the version being previewed — works for **any** version, not just drafts, since re-activating an older version should get the same preview treatment (per the DB schema doc's "no separate rollback mode" decision).
- **Behavior:** loads the currently active config (same query `evaluation-sessions/route.ts` uses) and the target version's config, loads the 5 golden fixtures (`goldenFixtures.ts`), and runs `scoreOffer()` for each fixture under both configs. **Read-only — never calls `persistOfferScore.ts`, never writes an `OfferScore` row.** This mirrors `GET /offers/{offerId}/score` (a pure read) rather than `POST .../compute-score` (a write) — hence `GET`, not `POST`, despite doing real computation, because it has no side effects.
- **Response `200`:**
  ```json
  {
    "activeVersion": 2,
    "previewVersion": 3,
    "fixtures": [
      {
        "fixtureId": "A",
        "label": "Strong offer",
        "active": { "categoryScores": { "Salary": 92, "...": "..." }, "overallScore": 88, "recommendationLabel": "Excellent fit — strong offer" },
        "preview": { "categoryScores": { "Salary": 92, "...": "..." }, "overallScore": 91, "recommendationLabel": "Excellent fit — strong offer" }
      }
    ]
  }
  ```
  Diffing (computing the deltas the UI/UX doc's table and chart render) happens client-side from this response — the endpoint's job is just to produce both scored results side by side, not to pre-compute deltas.
- **Response `404`:** the target version doesn't exist, or no active version exists at all (the latter shouldn't be reachable once Epic 10.2 ships, but the endpoint should still handle it gracefully rather than throw).

---

## Required, easy to miss: `public/openapi.yaml` sync

This project's `src/lib/offerguide/contract.test.ts` **fails the build if `openapi.yaml` and the actual routes ever drift in either direction** (confirmed — this is how the README describes it, and it's an existing, enforced test, not aspirational). Both new endpoints need entries added to the spec before this sprint can merge, or CI simply fails. Adding this as an explicit story rather than assuming it's implied by "add the endpoint":

- **New Story 10.2.8** — Add `POST .../scoring/{version}/activate` and `GET .../scoring/{version}/preview` to `public/openapi.yaml`, matching the existing `adminAuth` scheme used by every other `/admin/config/*` entry. Run `contract.test.ts` locally before opening the PR, not just at CI time.

---

## No other endpoint changes

Every other read (`GET /config/questions`, `/config/geography`, etc. — the **public**, non-admin config endpoints candidates' wizard actually uses) is untouched. This sprint's admin writes take effect through the exact same live-read paths already verified in the pre-flight check (Section 3, live enum validation) — an admin editing a question's options is visible to the wizard on the next request, with no cache-invalidation or extra plumbing needed, because nothing was ever cached in the first place.
