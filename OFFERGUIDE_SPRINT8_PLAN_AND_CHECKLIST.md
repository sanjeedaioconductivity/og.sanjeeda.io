# OfferGuide — Sprint 8 Review, Plan & DoD Checklist

**Scope:** Integration, QA & launch readiness. Sprint 8 builds no features — it
verifies that Sprints 1–7 match the contract, the FRS set, and the decisions
recorded across the project, and closes every defect that verification finds.

**Sources of truth (all read, field-level):**

| Doc | Notes |
|---|---|
| `OG_Sprint8_Handoff_v1_0.pdf` | scope, 54-operation contract table, DoD |
| `OG_SCR010_Results_FRS_v1_0.md.pdf` | §6.1 labels, §6.3–6.5 triggers, §7 weights — **authoritative over the prototype** |
| `public/openapi.yaml` | the contract as currently published |
| `src/lib/db/mongo/seed-offerguide.js` | `OgQuestions` / `OgScoringConfig` — the scoring baseline |

**Precedence applied throughout:** consent addenda → FRS → backlog → prototype.
`app.js` is **not** a reference in this sprint. The superseded-language table in
handoff §2 was applied — none of those items are raised as defects below.

---

## PART 1 — REVIEW

### 1.1 What already exists and is correct (do not rebuild)

| Asset | State |
|---|---|
| 29 route files under `src/app/api/offerguide/` | ✅ 49 of the 54 contract operations implemented |
| `requireAdmin()` interim gate (`lib/offerguide/adminAuth.ts`) | ✅ Env-token check, fails closed when unset, no `role` reference anywhere |
| `resolveIdentity()` / `resolveAuthedUser()` (`lib/offerguide/identity.ts`) | ✅ JWT takes precedence over `guestToken` cookie; bearer-only path has no guest fallback |
| `GET /config/questions` projection | ✅ Already excludes `score`, `yesNoScores`, `ratingMultiplier`, `numericBands`, `nullScore`, `options[].active` |
| All four public `/config/*` reads | ✅ Every one filters `active: true` |
| `OgScoringConfig` immutability | ✅ No `PUT`/`PATCH` route exists; `POST` rejects a duplicate version |
| Master consent toggle 409 | ✅ `blockMasterToggleDeletion()`, unit-tested |
| `priorityCategoryMap` default | ✅ Matches SCR-010 §7 **exactly**, including `Security → Stability` and `Flexibility / Commute → Work-Life` |
| `deriveGuidance()` | ✅ §6.3 (≥75, desc, cap 4), §6.4 (score-based then field-signal, cap 5), §6.5 (ascending, cap 4, fallback) all match the FRS |
| `scoreCategories()` | ✅ Groups by `question.category` at query time — genuinely field-driven, no hardcoded field→category map |
| `scoreSalary()` no-benchmark path | ✅ **Defined** — degrades role → location → full pool, then flat `SALARY_SCORE_NO_BASE_SALARY` when the collection is empty. Handoff §4.2 flagged this as a possible Sprint 5 defect; it is not one |
| `RECOMMENDATION_THRESHOLDS` | ✅ 85 / 72 / 58 — matches SCR-010 §6.1 |
| Existing test suite | ✅ 68 tests across 8 files, all green at sprint start |

### 1.2 Defect register

Eight defects found. All are fixed in this sprint. **D8 is the significant
one** — it changed scoring output, and it was found by the golden fixtures
rather than by inspection, which is the argument for having authored them.

- **[ ] D1 — Recommendation labels do not match SCR-010 §6.1.**

  `scoring/constants.ts` ships `Strong Fit` / `Good Fit` / `Proceed with Caution` /
  `Weak Fit`. The file's own comment admits the wording was provisional:
  *"pending confirmation against OG_SCR010_Results_FRS_v1_0.md, which is not
  present in this repo."* That document is now available and §6.1 is explicit:

  | Score range | Label (authoritative) |
  |---|---|
  | 85 and above | `Excellent fit — strong offer` |
  | 72 – 84 | `Good fit — negotiate a few points` |
  | 58 – 71 | `Moderate fit — clarify concerns` |
  | Below 58 | `Weak fit — proceed carefully` |

  Thresholds are already correct; only the four strings change.

- **[ ] D2 — Admin `DELETE` hard-deletes. DoD requires soft-delete.**

  `adminCrud.createItemHandlers()` calls `findByIdAndDelete()`. The DoD requires
  every `/admin/config/*` `DELETE` to set `active: false` and leave the document
  retrievable in the admin view. Sub-defect: **`OgMarketBenchmarks` has no
  `active` field at all**, so it cannot be soft-deleted without a schema change.

  Admin `GET` already returns unfiltered (`find({})`), so retired documents stay
  visible to admins with no change; public `/config/*` already filters
  `active: true`, so they correctly disappear for candidates.

- **[ ] D3 — Five contract operations do not exist in code.**

  | # | Operation | State |
  |---|---|---|
  | 10 | `GET /evaluation-sessions/{sessionId}/compare` | Missing — SCR-009 currently derives comparison client-side |
  | 21 | `GET /offers/{offerId}/score` | Missing — only `POST` exists, so a score cannot be re-read without recomputing |
  | 36 | `GET /admin/config/scoring/{version}` | Missing |
  | 41 | `POST /admin/config/geography/{countryCode}/cities` | Missing |
  | 42 | `PATCH /admin/config/geography/{countryCode}/cities/{cityId}` | Missing |

  These are contract operations the code does not satisfy, not new features —
  building them closes a gap against an existing specification, which is exactly
  what handoff §1 permits ("Defects found in this sprint are fixed in this sprint").

- **[ ] D4 — `openapi.yaml` documents 29 of 54 operations.**

  The published contract covers 13 paths (Sprint 5's own deliverables only) and
  says so in its own description. Handoff §3.1 requires 54 operations across 34
  paths. Story 8.1.1 cannot be executed at all until the contract file is
  complete — every candidate-facing route is currently undocumented.
  `info.version` is also `5.0.0`, not the `2.0.0` the DoD names.

- **[ ] D5 — Three shipped paths differ from the §3.1 contract table.**

  | §3.1 contract | Shipped |
  |---|---|
  | `POST /offers/{offerId}/compute-score` | `POST /offers/{offerId}/score` |
  | `/admin/config/scoring` | `/admin/config/scoring-config` |
  | `/admin/config/questions/{fieldId}`, `/geography/{countryCode}`, `/functional-domains/{domainId}`, `/consent-toggles/{toggleId}` | all `/{id}`, keyed on Mongo `_id` |

  **Decision: rename the routes to match §3.1.** The item-level params are not
  cosmetic — §3.1 names each collection's own business key, so lookups move from
  Mongo `_id` to `fieldId` / `countryCode` / `domainId` / `toggleId`. Every one of
  those keys is already declared `unique: true` on its schema.
  `/admin/config/market-benchmarks/{id}` stays on `_id` — §3.1 names it `{id}`
  and the collection has no single business key (it is keyed `role + location`).

- **[ ] D6 — Swagger UI is mounted at `/api-docs`, not `/docs`.**

  Handoff §3 states "`/docs` mounts `swagger-ui-react`". Resolved by adding
  `/docs` and leaving `/api-docs` in place, so any existing bookmark still works.

- **[ ] D7 — `README.md` is the unmodified `create-next-app` template.**

  The DoD requires five named known limitations documented there, "stated plainly
  rather than buried in comments".

- **[ ] D8 — A blank rating field scored 0 instead of `nullScore`.**

  Found by golden fixture C, which is the fixture whose stated purpose is to
  exercise `nullScore`. In `scoreRating()`:

  ```ts
  const value = typeof answer === "number" ? answer : Number(answer);
  if (!Number.isFinite(value)) return ENUM_FALLBACK_SCORE;
  return value * multiplier;
  ```

  `Number(null)` is **0**, not `NaN` — so it passed the `isFinite` guard and an
  untouched 1–5 slider scored `0 × 20 = 0`. That is worse than the worst answer
  a candidate could actually give (`1 × 20 = 20`), and nothing like the "genuine
  uncertainty" that a blank field means everywhere else in the engine.
  `undefined` took the intended path (`Number(undefined)` is `NaN` → 45), so the
  two blank representations disagreed with each other.

  Impact was concentrated where it hurt most: **Purpose is a single rating
  field**, so a candidate who skipped it scored Purpose **0**, not 45. Growth
  and Culture were dragged down too. On the "everything unknown" fixture the
  overall moved 36 → 45.

  Fixed by checking blankness explicitly before the numeric coercion, in all
  three score types, and honouring a per-question `nullScore` when one is
  configured. Regression-guarded in `specCompliance.test.ts`.

### 1.3 Recorded for sign-off, not fixed here

- **`info.version` 5.0.0 → 2.0.0 is a downgrade.** Earlier sprints versioned the
  contract by sprint number. The DoD names `2.0.0` explicitly, twice, and the
  handoff outranks the older convention — so `2.0.0` is what ships. Flagged
  because the version number now moves backwards in git history.
- **The code exposes 58 operations, the §3.1 table lists 54.** Sprint 5's shared
  CRUD factory also gave geography, market-benchmarks, functional-domains and
  consent-toggles an item-level `GET`, which §3.1 declares only for questions.
  Those four are documented in the contract and tagged `Superset`, and are
  excluded from the 54-operation count. Leaving a reachable admin route
  undeclared to protect a number would have been the worse trade. Either retire
  them or fold them into the inventory at Sprint 9.
- **`npm run build` is red for a reason outside OfferGuide.** The bundle
  compiles (110s, no errors), then TypeScript checking fails on five files that
  are untracked, pre-date this sprint, and were not touched by it:
  `api/pgp-candidate/attendance`, `api/pgp-candidate/programs`,
  `api/pgp-mentor/program/[id]`, `api/pgp-mentor/program/[id]/attendance`
  (Mongoose `.lean()` union typing), and `components/Home/ModernServices.tsx`
  (unused `@ts-expect-error` directives). `npx tsc --noEmit` reports **zero**
  errors across every OfferGuide file. Left alone deliberately — it is another
  module's in-flight work — but it does block a production build, so it needs
  clearing before launch.
- **`scoreBreakdown` is returned to the client.** `POST /compute-score` returns
  the full breakdown, including per-field scores and category weights — which is
  scoring data, delivered to the same candidate that `GET /config/questions`
  carefully withholds it from. The leak check in the DoD names `/config/questions`
  specifically, and this is useful for debugging, so it is out of scope to change
  unilaterally. Worth a decision before public launch.
- **Story 8.2.1's browser walkthrough is not automatable here.** Field parity,
  conditional-visibility dimming, the fixed `CompensationBar`, multi-offer
  navigation, and the download-summary file are verified by a human against
  `OFFERGUIDE_SPRINT8_MANUAL_QA.md`. Everything mechanically checkable is
  automated instead of being left to a click-through.
- **Live guest-cookie verification outside Swagger** (handoff §3, "known
  limitation") remains a manual `curl -b` pass. The auth-mode *declarations* are
  asserted automatically; the live cookie round-trip is on the manual sheet.

---

## PART 2 — PLAN

| # | Story | Work | Status |
|---|---|---|---|
| 1 | 8.2.2 | **D1** — correct the four labels, update the tests asserting them | ✅ |
| 2 | 8.1.1 | **D2** — soft-delete in `adminCrud`, `active` on `OgMarketBenchmarks`, retired benchmarks stop feeding new scores | ✅ |
| 3 | 8.1.1 | **D5** — rename routes to §3.1, move item lookups to business keys, update the one frontend caller | ✅ |
| 4 | 8.1.1 | **D3** — build the five missing operations | ✅ |
| 5 | 8.1.1 | **D4** — rewrite `openapi.yaml`: 54 operations, 34 paths, auth mode per operation, `info.version: 2.0.0` | ✅ |
| 6 | 8.1.1 | **D6** — mount `/docs` alongside `/api-docs` | ✅ |
| 7 | 8.2.2 | Five golden fixtures + committed expected output → permanent regression suite | ✅ |
| 8 | 8.2.2 | **D8** — blank rating fields resolve through `nullScore`, not 0 | ✅ |
| 9 | 8.1.1 / 8.2.3 | Automated verification suite | ✅ |
| 10 | 8.3.2 | **D7** — README known limitations | ✅ |
| 11 | 8.2.1 | Manual QA sheet for the browser-only criteria | ✅ |

### What shipped

**Code**

| File | Change |
|---|---|
| `src/lib/offerguide/adminCrud.ts` | Soft delete; business-key item lookups |
| `src/lib/offerguide/compareOffers.ts` | **New** — the winner rule, server-side and pure |
| `src/lib/offerguide/scoring/fieldScore.ts` | D8 — explicit blank handling in all three score types |
| `src/lib/offerguide/scoring/constants.ts` | D1 — SCR-010 §6.1 labels |
| `src/lib/offerguide/scoring/goldenFixtures.ts` | **New** — the five fixtures, derived from seed config |
| `src/lib/offerguide/scoring/persistOfferScore.ts` | Retired benchmarks excluded from scoring |
| `src/lib/db/mongo/models/OgMarketBenchmarks.js` | `active` field added |
| `.../evaluation-sessions/[sessionId]/compare/route.ts` | **New** — operation 10 |
| `.../offers/[offerId]/score/route.ts` | **New** — operation 21 (GET); compute moved to `compute-score` |
| `.../admin/config/scoring/[version]/route.ts` | **New** — operation 36 |
| `.../admin/config/geography/[countryCode]/cities/…` | **New** — operations 41–42 |
| `src/app/docs/page.tsx` | **New** — D6 |
| `src/app/offerguide/_state/api.ts` | `computeOfferScore` repointed; `getOfferScore`, `getSessionComparison` added |
| `src/app/offerguide/wizard/compare/page.tsx` | Winner now read from `/compare`, not derived client-side |
| `public/openapi.yaml` | 29 → 58 operations documented, `2.0.0` |

**Tests — 68 → 297**

| File | Covers |
|---|---|
| `contract.test.ts` | 54-op inventory ↔ route files ↔ contract, both directions; auth modes; immutability; leak check |
| `adminGate.test.ts` | Story 8.2.3's three rejection cases; every admin route gated; no `role` in logic |
| `adminCrud.test.ts` | Soft delete; destructive calls throw; business-key filters; gate before data access |
| `scoring/goldenFixtures.test.ts` | Fixtures A–E with committed expected output |
| `scoring/specCompliance.test.ts` | SCR-010 §6.1 / §7; field-driven categories; bands; overrides; salary paths |

---

## PART 3 — DEFINITION OF DONE

Verbatim from handoff §8. ✅ = verified automatically and re-verified on every
`npm test` run. ☐ = needs the browser, and is on
`OFFERGUIDE_SPRINT8_MANUAL_QA.md`.

### Epic 8.1 — Swagger & API verification

- [x] All 54 contract operations verified across their declared auth modes — `contract.test.ts`
- [ ] Every `guestOrAuth` route additionally verified outside Swagger with the guest cookie — **manual, Part A.** The *declaration* is automated; the live httpOnly-cookie round trip is not
- [x] `GET /config/questions` confirmed to leak no scoring data — projection and schema both asserted
- [x] Scoring-version immutability confirmed — no `PUT`/`PATCH` in the contract *or* exported by the route
- [x] Master-consent-toggle 409 confirmed
- [x] Soft-delete confirmed on every admin `DELETE` **(D2)** — destructive model calls throw in the test double
- [x] `info.version` in `openapi.yaml` corrected to `2.0.0` **(D4)**
- [x] `/docs` renders `openapi.yaml` with no parse errors **(D6)** — YAML parses in-test; visual check in Part A

### Epic 8.2 — End-to-end testing

- [ ] Full wizard walkthrough as guest and as registered user, SCR-000 → SCR-010 — **manual, Part B**
- [ ] Field-level parity against every FRS, SCR-001 → SCR-010 — **manual, Part B**
- [ ] Multi-offer add, compare, and delete paths — **manual, Part B** (the winner *rule* is automated as fixture E)
- [x] Five golden fixtures authored, committed, and passing against the default scoring config
- [x] Category composition confirmed field-driven, not hardcoded
- [x] Numeric bands, `nullScore`, and the two documented enum overrides confirmed correct — **D8 found and fixed here**
- [x] Salary scored via the benchmark percentile path and excluded from generic averaging; no-benchmark behaviour defined and verified — it was already defined; not a Sprint 5 defect
- [x] Weighting, priority mapping, and the four recommendation thresholds confirmed against SCR-010 §7 **(D1)**
- [x] `scoringConfigVersion` recorded on every score row; recomputation reproducible
- [x] Interim admin gate rejects no-credential, guest, and ordinary-user-JWT access — `adminGate.test.ts`; live spot-check in Part C

### Epic 8.3 — Launch prep

- [ ] Consent verified: captured on SCR-001, candidate-level, config-driven, defaults Off, read-only on SCR-009 — **manual, Part D**
- [x] Known limitations documented in the repository README **(D7)**
- [x] All Sprint 8 defects closed (D1–D8)
- [ ] Sign-off recorded — **on the manual QA sheet, after Parts A–E**

---

## PART 4 — OUT OF SCOPE (handoff §6)

RBAC of any kind · replacing the interim admin gate · any admin UI · new
features, screens, endpoints or scoring rules · live community data · the
`HelpIcon` retrofit to SCR-001…007 · the non-functional QA sweep · prototype
comparison.
