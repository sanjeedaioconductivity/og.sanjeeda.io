# OfferGuide — Sprint 10 Plan &amp; Checklist: Admin Configuration UI

**Status:** Draft — not yet started. Written against `main` @ `fffae98` (Sprint 9 + the `v2-no-offerguide-link` merge, RBAC live).

**Sprint goal:** Build the UI the admin config API has never had. `/api/offerguide/admin/config/*` (30 operations across 6 collections) has existed since Sprint 5, gated by real RBAC since Sprint 9, and has zero screens. Every change to a question, a scoring weight, or a benchmark today requires hand-editing Mongo. This sprint closes that gap for all 6 admin-managed collections: `OgQuestions`, `OgScoringConfig`, `OgMarketBenchmarks`, `OgGeography`, `OgFunctionalDomains`, `OgConsentToggles`.

**Explicitly not a re-architecture sprint.** The admin API contract stays as-is except for the one deliberate addition in Epic 10.2 (scoring activation). No new permissions, no changes to the public-facing wizard, no changes to `CandidateProfile`/`Offer`/scoring formulas — except the one bug fix in Epic 10.7, found during this sprint's own pre-flight verification, not caused by anything this sprint builds.

---

## Epic 10.1 — Admin Shell &amp; Navigation

**Why:** Sprint 9 built the admin permission tier but its nav only links to `/api-docs` — there's been no destination for `portal.admin.access` to actually go to. This epic gives it one.

- **Story 10.1.1** — New route group `src/app/offerguide/admin/` (nested under the existing `offerguide` feature folder, not a new top-level feature — keeps naming-convention rule 1's "lowercase, single word" scope intact at the top level while the sub-route is free to be a normal segment). Layout wraps every admin page in a `requireAdmin`-equivalent client check via `usePermission("portal.admin.access")`, redirecting non-admins to `/offerguide` — mirrors the existing `AuthProvider` pattern already used by `candidate`/`mentor`/`management` shells, but keyed on the unified `SanjeedaUsers.role` system, not a separate portal cookie.
- **Story 10.1.2** — Landing page (`/offerguide/admin`) with 6 cards (Questions, Scoring, Benchmarks, Geography, Functional Domains, Consent Toggles), each showing a live count (active / retired) pulled from its collection's `GET` endpoint.
- **Story 10.1.3** — Update `navSections.ts`'s admin tier: replace the bare `/api-docs`-only entry with a section pointing at `/offerguide/admin` (keep the `/api-docs` link too, don't remove it — it's still useful for raw contract inspection). Update `navSections.test.ts` accordingly — this file already has a strong "pins the nav shape" precedent from Sprint 9/the nav-removal-and-flag saga; follow it.

**Out of scope:** any new permission string. `portal.admin.access` already exists and already means "can reach admin surfaces" — reuse it as-is rather than inventing per-resource permissions this sprint.

---

## Epic 10.2 — Scoring Configuration Admin

**This is the highest-risk epic in the sprint** — it's the one place this sprint touches the API contract, not just adds a UI on top of an unchanged one.

### The problem being solved

`OgScoringConfig` versions are permanently immutable by design (no PUT/PATCH/DELETE, and that stays true after this sprint). But `isActive` — the flag `POST /evaluation-sessions` actually reads (`findOne({isActive:true}).sort({version:-1})`) to decide which config new sessions get stamped with — has no safe way to move. Today, `POST /admin/config/scoring` creates a version with whatever `isActive` value the caller sends, and nothing ever flips an old version back off. It happens to work because the session-creation query sorts descending, but that's an accident of query order, not a contract.

### Decision made for this sprint

Creating a version and activating it become two separate, deliberate actions:

- **Story 10.2.1** — Change `OgScoringConfig`'s schema default: `isActive` defaults to `false`, not `true`. A newly POSTed version is a draft until explicitly activated. (This is a schema default change, not a breaking change to any existing document — existing versions keep whatever `isActive` value they already have.)
- **Story 10.2.2** — New endpoint: `POST /api/offerguide/admin/config/scoring/{version}/activate`. Single admin-gated handler that, in one Mongo multi-document transaction (`mongoose.startSession()` + `withTransaction()`), sets `isActive: false` on every version except the target, then `isActive: true` on the target. **Confirmed safe to use a real transaction**: Sprint 4's DOD checklist records verification running "live against local MySQL + Mongo Atlas," so dev/verification/production all sit on MongoDB Atlas — Atlas has no standalone deployment mode, every tier (including free M0) is provisioned as a replica set, and this project's Mongoose (`^8.16.0`) is well past the `>=5.2` minimum for transaction support. Note this is the **first use of a Mongo transaction anywhere in this codebase** — no existing helper/pattern to copy, so budget a little extra review time for the session-handling code itself, and add a small shared `withMongoTransaction()` helper in `src/lib/offerguide/` rather than inlining session boilerplate directly in the route, since Epic 10.5's per-collection screens may want the same primitive later. Returns the newly-active config. Re-activating an already-active version is a no-op that still returns 200 (matches the existing soft-delete idempotency pattern in `adminCrud.ts`).
  - This is the one deliberate, narrow exception to "no PUT/PATCH/DELETE ever" on this collection — scoped to exactly one field (`isActive`), never the scoring content itself. Document this reasoning in the route file's header comment the way the existing immutability comment does, so a future reader doesn't read this as a contract violation.
- **Story 10.2.3** — Test coverage: activating version B while A is active leaves exactly one `isActive:true` document; concurrent activation calls don't leave two active; activating a version that doesn't exist 404s; the existing `contract.test.ts`/`specCompliance.test.ts` suites get a new case confirming `POST /evaluation-sessions` still resolves to the correct (now explicitly activated) version.

### UI

- **Story 10.2.4** — Version history table: every version, `effectiveFrom`, `isActive` badge, "View" (read-only detail matching `GET /admin/config/scoring/{version}`).
- **Story 10.2.5** — "New Version" editor: clones the currently-active version's full config as a starting point (category weights, `priorityBoost`, `priorityCategoryMap`, `importanceWeighting`, `evaluationTypeBonus`), lets the admin edit every field, and POSTs as a new (inactive) version on save. No in-place editing of an existing version's fields — the form always produces a new version number.
- **Story 10.2.6 — Golden-fixture preview.** Before an admin can activate a draft version, show a diff table: each of the 5 fixtures (A-Strong, B-Weak, C-High-uncertainty, D-Minimum-viable, E-Multi-offer) scored under the *currently active* config vs. the *draft* config, side by side, with the delta highlighted per category and overall. **Requires a new endpoint** — `GET /admin/config/scoring/{version}/preview` (see the endpoints doc) — since `scoreOffer()` is a pure function but loading `OgQuestions`/`OgMarketBenchmarks`/the two config versions can only happen server-side. Read-only dry run, never writes an `OfferScore` row. Frame it as a warning surface, not a hard gate: the admin can still activate a version that swings a fixture's recommendation label, but they see it coming first. Works for any version number, not just drafts, since re-activating an older version gets the same preview treatment.
- **Story 10.2.7** — Activate button on a draft version's detail view, calls 10.2.2, shows the same fixture-diff summary (re-fetched or cached from 10.2.6) as a confirmation step before the actual POST.
- **Story 10.2.8** — Add both new endpoints (`.../activate`, `.../preview`) to `public/openapi.yaml`. `src/lib/offerguide/contract.test.ts` fails the build if the spec and routes drift — this isn't optional cleanup, it's an existing enforced gate.

**Explicitly deferred:** editing `evaluationTypeBonus`/`importanceWeighting` via anything friendlier than raw numeric inputs (a full "weight tuning" visual UI is a separate, later sprint if it's ever wanted); scheduling a future activation (`effectiveFrom` in the future that auto-activates); per-category weight presets/templates.

---

## Epic 10.3 — Questions Admin (`OgQuestions`)

- **Story 10.3.1** — List view grouped by `screen` then `category`, sortable by `sortOrder`, with an Active/Retired filter (retired = `active:false`, kept per the soft-delete contract — never hard-deleted, since past evaluations still reference them by meaning).
- **Story 10.3.2** — Field editor covering all three remaining `scoreType`s post-cleanup (`enum`, `rating`, `numeric`) — see Epic 10.6 for why `yesno` is four, not three, before this sprint:
  - `enum`: options table (value, sortOrder, active, score) with add/reorder/retire-in-place rows.
  - `rating`: `ratingMultiplier` numeric input, live-computed preview ("a rating of 4 scores {4×multiplier}").
  - `numeric`: `numericBands` editor (ordered list of `{upTo, score}`, last band open-ended) plus `nullScore`, with a validation rule that bands must be strictly ascending on `upTo`.
- **Story 10.3.3** — Category dropdown constrained to the live 6-category enum (`Benefits, Stability, Work-Life, Growth, Culture, Purpose`) — never free text, matching how the scoring engine groups by this field verbatim.
- **Story 10.3.4** — Retire/reactivate via the existing soft-delete `DELETE` (sets `active:false`) and a `PUT {active:true}` to bring one back — confirm the generic `createItemHandlers` factory's `PUT` already supports this (it does, it's a partial merge) so no API change needed here.
- **Story 10.3.5** — Guard rail: block a `fieldId` rename entirely (it's the collection's business key, and it's the FK-like string other rows/history implicitly depend on) — the UI should not offer to edit `fieldId` on an existing document at all, only on create.

---

## Epic 10.4 — Market Benchmarks Admin (`OgMarketBenchmarks`)

- **Story 10.4.1** — Table view: role, location, currency, p25/p50/p75, sampleSize, effectiveFrom. Filter/search by role or location.
- **Story 10.4.2** — Add/edit form with client-side validation `p25 <= p50 <= p75`, plus a matching server-side Mongoose custom validator declared directly on `OgMarketBenchmarks.js` (not a change to `adminCrud.ts` or the route files — `.create()` and the existing `findOneAndUpdate(..., {runValidators:true})` both pick it up automatically). See the endpoints doc for the exact validator code.
- **Story 10.4.3** — Surface the existing `{role, location}` uniqueness constraint as a clean inline form error (today a duplicate just bubbles up as a raw Mongo duplicate-key error via `badRequest(err.message)` — catch the `E11000` case specifically and show "A benchmark for this role and location already exists — edit it instead of creating a new one.").
- **Story 10.4.4** — Since this collection is keyed on Mongo `_id` (no business key, per `adminCrud.ts`'s own comment), make sure the edit/retire actions in the UI carry `_id` correctly rather than trying to key on role+location client-side.

---

## Epic 10.5 — Geography, Functional Domains, Consent Toggles Admin

Grouped into one epic because all three ride the same generic `adminCrud` factory and can share one generic table+form component, parameterized per collection — this is meant to be the cheap epic.

- **Story 10.5.1** — Shared `AdminCollectionTable`/`AdminCollectionForm` components, schema-driven off a small per-collection config object (field list, labels, validation) rather than three near-duplicate screens.
- **Story 10.5.2** — Geography: country list with embedded cities editor (add/retire city inline — remember cities have no own `_id` per the schema, so city edits are array-index operations against the parent country document via `PUT /admin/config/geography/{countryCode}`, not a separate resource).
- **Story 10.5.3** — Functional Domains: flat list, straightforward add/retire.
- **Story 10.5.4** — Consent Toggles: flat list, but the master toggle (`isMaster:true`, i.e. `consent_share_anonymous`) needs its retire action to surface the existing server-side 409 ("cannot retire the master consent toggle") as a clear inline message rather than a raw error toast.

---

## Epic 10.6 — Remove the dead `yesno` scoreType

**Why now:** flagged as retired since Sprint 5, zero fields have used it since the Sprint 3 seed data was written, but the enum value and `yesNoScores` sub-schema are still declared in `OgQuestions.js`. Rebuilding the Questions admin UI from scratch is the natural point to close this rather than build a new editor that still has to account for a type nothing uses.

- **Story 10.6.1** — Pre-flight check (script or one-off query, not a permanent migration): confirm `OgQuestions.countDocuments({scoreType: "yesno"})` is `0` in every environment before touching the schema. If it's ever non-zero somewhere, stop and re-scope this story — don't silently drop data.
- **Story 10.6.2** — Remove `"yesno"` from the `scoreType` enum and remove the `yesNoScores` sub-schema from `OgQuestions.js`. Update `seed-offerguide.js`'s comment that currently explains the retirement (it can now say "removed" instead of "retired but still declared").
- **Story 10.6.3** — Update the Questions admin editor (Story 10.3.2) to only ever offer `enum`/`rating`/`numeric` — no code path should be able to construct a `yesno` document going forward.
- **Story 10.6.4** — Re-run `specCompliance.test.ts` and the full suite after the schema change — confirm nothing (fixtures, seed data, other tests) implicitly depended on the enum accepting `"yesno"`.

---

## Epic 10.7 — Fix missing Offer-level fields in scoring input

**Why:** found during Sprint 10's own pre-flight verification (2026-09-10), not caused by anything this sprint builds — but the same verification that gave us confidence to build the admin UI turned up a real, currently-live scoring bug worth closing alongside it. `persistOfferScore.ts`'s `answerSources` array is `[offer.benefitsSecurity, offer.workLife, offer.growth, offer.culture]` — it never includes `offer` itself. Two Stability-category fields, `offer_employment_type` and `offer_probation`, live on the base `Offer` model rather than any sub-model, so they are structurally invisible to `flattenAnswers()` and always resolve to the blank/`nullScore` default (45) — **every candidate's Stability score today ignores these two fields entirely, regardless of what they actually answered on SCR-003.** Existing unit tests (`scoreOffer.test.ts`, `categoryScore.test.ts`) didn't catch this because they hand-build their answer objects and happen to include these two fields directly, bypassing the real wiring — there is no test at all for `persistOfferScore.ts` itself.

- **Story 10.7.1** — Add `offer` to `persistOfferScore.ts`'s `answerSources` array so `flattenAnswers()` actually sees `offerEmploymentType`/`offerProbation` alongside the four sub-models.
- **Story 10.7.2** — Add a regression test for `persistOfferScore.ts` itself (zero coverage today) exercising the real end-to-end wiring: persist an `Offer` with a non-default `offerEmploymentType`/`offerProbation`, compute-and-persist a score, assert the Stability category score actually reflects it — not just that `scoreOffer()`/`scoreCategories()` behave correctly in isolation, which existing tests already confirm.
- **Story 10.7.3** — Re-run `goldenFixtures.test.ts`/`specCompliance.test.ts` after the fix and update the fixtures' committed expected outputs where they move, with a comment explaining why — matching this project's own documented practice ("any change that moves those numbers fails goldenFixtures.test.ts intentionally, so the movement gets reviewed").
- **Story 10.7.4** — One-line confirmation in the PR description that `offer_employment_type`/`offer_probation` are the *only* two scored fields living on the base `Offer` model rather than a sub-model (verified true during the pre-flight check), so this is a complete fix, not a partial one.

---

## QA &amp; Definition of Done

Matching the rigor established in Sprints 8–9 (golden fixtures, spec-compliance suite, manual regression):

- [ ] All 6 admin resources: full create/edit/retire/reactivate cycle works end-to-end against a real (non-mocked) Mongo instance.
- [ ] Scoring: draft → preview → activate flow tested with a deliberately-bad draft config (e.g., a zeroed-out category weight) to confirm the fixture-diff surfaces the swing before activation, not after.
- [ ] `permissions.test.ts`'s bare-`role===`-comparison grep test still passes with zero new violations introduced by admin UI code.
- [ ] Non-admin (`role='user'`) and guest sessions are confirmed unable to reach `/offerguide/admin/*` (redirect, not a broken page) and unable to call any `/api/offerguide/admin/*` endpoint (403, matching existing `adminAuth.test.ts` coverage — extend it with the new activate endpoint).
- [ ] `OgQuestions` `yesno` removal: pre-flight count was 0 in every environment before the schema change shipped; full suite green after.
- [ ] Epic 10.7: `persistOfferScore.ts` includes `offer` in `answerSources`; new regression test covers the real end-to-end wiring (not just isolated `scoreOffer()`/`scoreCategories()` unit tests); golden fixtures re-verified and any moved expected values reviewed and committed deliberately.
- [ ] Manual QA pass: an admin can, in one sitting, add a new question, add a new benchmark, create+preview+activate a new scoring version, and see a real candidate session (in a lower environment) pick up the newly activated version.
- [ ] README's admin-related known-limitations section updated: remove "admin config API has no UI" and "no self-service admin promotion" stays accurate (this sprint doesn't touch admin *promotion*, only admin *configuration* — don't conflate the two in the writeup).

## Explicitly deferred to backlog

- Config-change audit log (who changed what, when) — no schema for this exists anywhere in the project; worth its own small design pass rather than bolting on here.
- Bulk import/export (e.g. CSV for market benchmarks, JSON export/import of a full questions set for staging→prod promotion).
- A 4th "benchmark data steward" role narrower than full admin (mentioned as a hypothetical in Sprint 9's docs) — this sprint's admin UI is all-or-nothing behind `portal.admin.access`, same as the API already is.
- Scheduled/future-dated scoring activation.
- Multi-language editing for question `label`/`helpText` (the wizard itself has English/Urdu i18n already; admin-authored content stays English-only for now).
