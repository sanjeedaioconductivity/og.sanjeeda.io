# OfferGuide — Sprint 10 Database Schema

**Status:** Draft. Companion to the Sprint 10 plan, FRS, and UI/UX docs.

**Headline: this sprint changes almost no schema.** It's a UI layer on top of 6 collections that already exist and already work. Exactly two schema-level changes are in scope (both in `OgQuestions`/`OgScoringConfig`, both already called out in the plan); everything else below is *documentation* of the existing shape the admin UI has to render and edit correctly, not a proposal to change it. Prisma/MySQL has **zero** changes this sprint — Epic 10.7's fix is application code only (`persistOfferScore.ts`), since `offerEmploymentType`/`offerProbation` already exist as columns; the bug was that nothing read them, not that they were missing.

---

## The two actual schema changes

### 1. `OgScoringConfig.isActive` — default flips `true` → `false` (Epic 10.2.1)

**Current schema** (`src/lib/db/mongo/models/OgScoringConfig.js`):
```js
version: { type: Number, required: true, unique: true },
isActive: { type: Boolean, default: true }, // exactly one version should be active at a time
```

**Change:** `default: false`. A version created via `POST /admin/config/scoring` is a draft until explicitly activated via the new `POST .../{version}/activate` endpoint (Epic 10.2.2).

**Migration need: none for existing data.** Checked the actual seed data (`seed-offerguide.js:687-694`): version 1 is seeded with `isActive: false`, version 2 with `isActive: true`. Exactly one active version exists today. The schema default change only affects future `.create()` calls that omit the field — it does not retroactively touch already-stored documents, and none need touching.

**The "latest version + active status" selection mechanic — document this explicitly, since it's the one subtle piece of query logic the whole activation model depends on:**

- **Where it's read (unchanged by this sprint):** `POST /evaluation-sessions` (`src/app/api/offerguide/evaluation-sessions/route.ts:39-53`) does `OgScoringConfig.findOne({ isActive: true }).sort({ version: -1 })` to decide which version to stamp onto a brand-new session. This is the **only** place "active" config is ever resolved at runtime — every subsequent read (scoring, score display) uses the version number pinned to that session, never re-resolves "active" (verified in the pre-flight check).
- **Why `.sort({version:-1})` exists at all:** it's an accident-shaped safety net. If more than one document ever had `isActive:true` simultaneously (which nothing currently prevents, pre-Epic-10.2), this query still deterministically picks the highest version number among them — so a stray double-active state degrades gracefully instead of picking an arbitrary/oldest one. It is not, and was never, a substitute for actually enforcing "exactly one active."
- **What Epic 10.2 changes:** the new `activate` endpoint makes "exactly one active" a real, enforced invariant (atomic transaction: deactivate all, activate one) for the first time, rather than an invariant that happens to hold because whoever inserts documents is careful. The `.sort({version:-1})` safety net in `evaluation-sessions/route.ts` doesn't need to change — it's harmless to leave in place as defense-in-depth even once activation is properly atomic, and removing it buys nothing.
- **One cheap sanity-check worth adding, not a migration:** a one-time read-only query (`OgScoringConfig.countDocuments({isActive:true})`) as part of this sprint's pre-deployment checklist, confirming production also has exactly one active version before the admin UI ships — the seed data is correct, but production may have drifted if anyone ever touched Mongo by hand. If it finds more than one, that's a manual fix (flip the extras to `false`) before the activate endpoint's transaction logic takes over, not a code change.

### 2. `OgQuestions.scoreType` — remove `"yesno"` (Epic 10.6)

**Current schema:**
```js
scoreType: { type: String, required: true, enum: ["enum", "yesno", "rating", "numeric"] },
// ... elsewhere in the schema:
yesNoScores: {
  yes: { type: Number, default: 100 },
  somewhat: { type: Number, default: 65 },
  unknown: { type: Number, default: 45 },
  no: { type: Number, default: 20 },
},
```

**Change:** enum becomes `["enum", "rating", "numeric"]`; the `yesNoScores` sub-object is deleted from the schema entirely.

**Migration need: a pre-flight count, not a data migration** (Story 10.6.1, unchanged from the original plan) — confirm `OgQuestions.countDocuments({scoreType: "yesno"})` is `0` in every environment. Since Mongoose enum validation only runs on write, existing documents with a now-invalid value wouldn't error on read — but there should be zero such documents anyway (confirmed nothing in the seed data uses it). No document needs modifying; this is a pure enum/subschema narrowing.

---

## Full reference: the 6 admin-managed collections as they exist today

For the record, so the admin UI is built against the real shape, not a re-derived guess. No changes to any of these beyond the two above.

**`OgQuestions`** (`og_questions`, if a custom collection name is set — confirm at build time) — see the FRS's ADM-001 field inventory for the UI-facing shape; the one addition worth noting here is `active: {type: Boolean, default: true}` and `sortOrder: {type: Number, default: 0}` are plain top-level fields (not part of any scoring sub-object), and `fieldId` carries a unique index (`unique: true` on the schema path, which Mongoose/MongoDB backs with a real unique index) — the admin API's `PUT` keys off this field, so no separate index work is needed for Epic 10.1's lookups.

**`OgScoringConfig`** (`og_scoring_configs`) — `version` unique-indexed (same mechanism as above). No compound index exists on `{isActive, version}`; the `findOne({isActive:true}).sort({version:-1})` query in `evaluation-sessions/route.ts` currently does a collection scan filtered then sorted in memory (the collection is small — a handful of versions ever — so this is a non-issue at current scale, not worth a new index this sprint).

**`OgMarketBenchmarks`** (`og_market_benchmarks`) — compound unique index on `{role: 1, location: 1}` (this is what Story 10.4.3's "surface the duplicate-key error nicely" is catching). Confirmed `active: {type: Boolean, default: true}` is present — added in Sprint 8 specifically because, per that file's own comment, this was "the only one missing the flag the other five already had." Epic 10.4's soft-delete via the generic `adminCrud` factory works against it exactly as-is; no schema addition needed.

**`OgGeography`** (`og_geography`) — `countryCode` unique-indexed; `cities` is an embedded array with `_id: false` on the sub-schema (per the FRS, cities have no independent identity) — city "editing" is always a full-document `PUT` on the parent country, never a sub-document `_id`-addressed update, because there's no `_id` to address.

**`OgFunctionalDomains`** (`og_functional_domains`) — `domainId` unique-indexed. Simplest schema in the set; nothing beyond what's in the FRS.

**`OgConsentToggles`** (`og_consent_toggles`) — `toggleId` unique-indexed; `isMaster` is a plain boolean with no schema-level enforcement of "exactly one master" — that invariant is enforced in the API layer (the 409-on-retire check), not the database. Worth knowing: nothing stops two documents from both having `isMaster:true` at the schema level, same category of "enforced in code, not in the collection" as `OgScoringConfig.isActive` was before Epic 10.2. Out of scope to fix this sprint (only `OgScoringConfig` got the atomic-enforcement treatment, because it's the one where a double-active state actually changes candidate-facing behavior; a double-master consent toggle is a data-hygiene smell, not a live bug) — but flagging the parallel so it doesn't look like an oversight.

---

## Confirmed unaffected

- **Prisma/MySQL:** zero migrations this sprint. `Offer`, `OfferCompensation`, `OfferBenefitsSecurity`, `OfferWorkLife`, `OfferGrowth`, `OfferCulture`, `OfferScore`, `CandidateProfile`, `EvaluationSession`, `UserInfo` all unchanged.
- **Epic 10.7's fix:** application-code only. `offerEmploymentType`/`offerProbation` already exist as `Offer` columns (`schema.prisma:210`/`:212`) — the bug was that `persistOfferScore.ts` never read them, not that they were missing from the schema. No migration.
