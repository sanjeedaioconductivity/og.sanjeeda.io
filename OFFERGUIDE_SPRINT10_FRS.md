# OfferGuide — Sprint 10 FRS: Admin Configuration UI

**Status:** Draft, no PO sign-off yet. Companion to `OFFERGUIDE_SPRINT10_PLAN_AND_CHECKLIST.md`.

**Note on provenance:** unlike `SCR-000`–`SCR-010`, there is no pre-existing per-screen FRS for the admin surface — it's never had a UI. Screen IDs below (`ADM-000`–`ADM-006`) are newly introduced, parallel to the `SCR-0xx` convention, and reserved starting at `000` in their own namespace so they never collide with a future `SCR-011`.

---

## ADM-000 — Admin Landing

**Purpose:** Entry point for `portal.admin.access`. Replaces the Sprint 9 placeholder that pointed the admin nav tier only at `/api-docs`.

**Data source:** `GET` on each of the 6 admin collections, count only (active vs. retired).

**Layout:** 6 cards (Questions, Scoring, Market Benchmarks, Geography, Functional Domains, Consent Toggles), each showing an active/retired count. A 7th, unstyled link to `/api-docs` stays present — it's still the raw contract reference.

**Key Product Decisions:**
- **DECIDED — no "current admins" list here.** Admin identity/promotion is script-only by explicit Sprint 9 design ("nobody can escalate themselves"), and this sprint touches configuration, not admin management. Surfacing "who are the admins" would need a new read endpoint that doesn't exist and isn't in this sprint's scope — stays a `npm run admins` CLI-only fact.
- **DECIDED — non-admins get redirected, not shown a 403 page.** Matches the existing `AuthProvider` pattern on `candidate`/`mentor`/`management` shells: a `user`-role or guest session hitting `/offerguide/admin/*` is bounced to `/offerguide`, not shown a broken/blocked screen.

---

## ADM-001 — Questions List &amp; Editor

**Purpose:** CRUD for `OgQuestions` — the 40-ish scored fields that drive the wizard and scoring engine.

**Data source:** `GET/POST /admin/config/questions`, `GET/PUT/DELETE /admin/config/questions/{fieldId}`.

**Field inventory** (per document):

| Field | Type | Notes |
|---|---|---|
| `fieldId` | string, unique | Business key. **Immutable after creation** — no rename path, ever (Story 10.3.5). |
| `screen` | string | e.g. `"SCR-003"` — which wizard screen this field belongs to. Free text (no live screen registry to validate against). |
| `category` | enum | `Benefits, Stability, Work-Life, Growth, Culture, Purpose` — locked dropdown, never free text. |
| `label`, `helpText` | string | Shown to candidates. |
| `uiControl` | string | e.g. `"dropdown"`, `"radio_cards"` — informational, not rendered by the admin UI itself. |
| `scoreType` | enum | `enum, rating, numeric` post-Epic-10.6 (`yesno` removed). |
| `options[]` | array (enum only) | `{value, sortOrder, active, score}` |
| `ratingMultiplier` | number (rating only) | Score = value × multiplier. |
| `numericBands[]` / `nullScore` | array / number (numeric only) | Ascending `{upTo, score}` thresholds; `nullScore` for blank/"Not clear". |
| `active` | boolean | Soft-delete flag. |
| `sortOrder` | number | Display order within a screen. |

**Layout:** list grouped by `screen` → `category`, Active/Retired filter, sortable by `sortOrder`. Row click opens the editor, which renders a different form body depending on `scoreType` (an enum's options table looks nothing like a numeric field's band editor).

**Key Product Decisions:**
- **DECIDED — retiring a question is one click + a lightweight confirm, not a typed confirmation.** It's reversible (soft delete, `PUT {active:true}` brings it back) and doesn't touch anything already scored, so heavy friction isn't warranted.
- **DECIDED — `category` reassignment is allowed on an existing field with no extra warning.** This is explicitly how the scoring engine is meant to be retuned per the project's own design principle ("moving a question between categories is a document edit, not a code change") — treating it as scary would fight the architecture.
- **RESOLVED 2026-09-10 — `scoreType` changes on an existing field are blocked.** Changing `enum`→`numeric` on a field with live historical scores would retroactively change what its stored option-scores *meant*, unlike category reassignment which the engine is explicitly designed to tolerate. The editor only allows setting `scoreType` at creation; changing it on an existing field requires creating a new field and retiring the old one.

---

## ADM-002 — Scoring Configuration

**Purpose:** View version history, draft a new scoring version, preview its impact, and activate it.

**Data source:** `GET /admin/config/scoring` (list), `GET /admin/config/scoring/{version}` (detail), `POST /admin/config/scoring` (create draft), **new** `POST /admin/config/scoring/{version}/activate`.

**Field inventory:** `version` (int, unique), `effectiveFrom` (date), `isActive` (bool — defaults `false` post-10.2.1), `categoryBaseWeights` (7 categories, default 1 each), `priorityBoost` (default 1.2), `priorityCategoryMap` (8 priority labels → 7 categories), `importanceWeighting` (3 sliders, scale + per-point/tier values), `evaluationTypeBonus` (4 evaluation types, each a label→number map).

**Layout:**
1. Version history table: version #, `effectiveFrom`, Active/Draft badge, "View."
2. New-version editor: pre-filled by cloning the currently active version; every weight field editable; Save produces a new draft version (never edits an existing one).
3. Fixture-diff preview: all 5 golden fixtures (A–E), each showing active-config score vs. draft-config score per category and overall, deltas highlighted.
4. Activate action, from a draft's detail view.

**Key Product Decisions:**
- **RESOLVED 2026-09-10 — activation is a standard confirm dialog, not a typed/two-step confirmation.** The fixture-diff preview *is* the safety mechanism — an admin who reaches the Activate button has already seen exactly what will change. A "type the version number to confirm" step on top would be friction without new information.
- **DECIDED — the diff preview is a warning, not a hard gate.** An admin can activate a version that would flip a fixture's recommendation label; the point is informed consent, not a rule the system enforces on their behalf. Matches the sprint plan's existing framing.
- **DECIDED — no way to "unpublish" back to a prior version from this screen beyond activating that older version number again.** Because versions are immutable and `isActive` just points at one, re-activating version N-1 is a completely ordinary action here, not a special "rollback" mode. No separate rollback UI needed.

---

## ADM-003 — Market Benchmarks

**Purpose:** CRUD for `OgMarketBenchmarks`, the reference data behind the Salary score's percentile formula.

**Data source:** `GET/POST /admin/config/market-benchmarks`, `GET/PUT/DELETE /admin/config/market-benchmarks/{id}` (Mongo `_id`, no business key).

**Field inventory:** `role`, `location`, `currency`, `p25`, `p50`, `p75`, `sampleSize` (default 0), `effectiveFrom`. Unique on `{role, location}`.

**Layout:** searchable/filterable table; add/edit form.

**Key Product Decisions:**
- **DECIDED — `p25 <= p50 <= p75` is a hard block, client and server.** Unlike most other validation in this sprint (soft, correctable later), a violated percentile order actively corrupts every Salary score computed against this row while it's live. Both the form and a model-level Mongoose validator enforce it (Story 10.4.2).
- **DECIDED — duplicate `{role, location}` shows a specific inline message** ("already exists — edit it instead"), not a raw database error.
- **RESOLVED 2026-09-10 — a soft warning shows when `sampleSize` is below the scoring engine's own `MIN_POOL_SIZE` (3).** Not a block — the row is valid and saves normally — but the form shows "fewer than 3 samples — the scoring engine will prefer a broader match until this grows," since this is engine behavior an admin would otherwise have no way to discover.

---

## ADM-004 — Geography

**Purpose:** CRUD for `OgGeography` — countries with embedded cities.

**Data source:** `GET/POST /admin/config/geography`, `GET/PUT/DELETE /admin/config/geography/{countryCode}`, plus the nested city operations (`.../cities`, `.../cities/{cityId}`).

**Field inventory:** `countryCode` (unique), `countryName`, `active`, `cities[]` (`{cityId, name, active}`, no own top-level `_id`).

**Layout:** country list; expanding a country reveals its cities inline (add/retire city as array operations against the parent document, not a separate table).

**Key Product Decisions:**
- **DECIDED — cities are edited as part of the country form, never as a standalone screen.** Matches the schema (embedded, no independent identity) — giving them their own list screen would misrepresent the data model.

---

## ADM-005 — Functional Domains

**Purpose:** CRUD for `OgFunctionalDomains` — flat reference list for the candidate profile's domain dropdown.

**Field inventory:** `domainId` (unique), `name`, `active`, `sortOrder`.

**Layout:** flat list via the shared generic table+form (Story 10.5.1). No screen-specific decisions — this is deliberately the simplest screen in the sprint.

---

## ADM-006 — Consent Toggles

**Purpose:** CRUD for `OgConsentToggles` — the candidate-facing consent options on SCR-001.

**Field inventory:** `toggleId` (unique), `label`, `helpText`, `sourceScreen`, `isMaster` (true only for `consent_share_anonymous`), `active`, `sortOrder`.

**Key Product Decisions:**
- **DECIDED — the master toggle's retire button is present but always fails with a clear inline message**, surfacing the API's existing 409 rather than hiding the button outright. Showing-then-explaining is more honest than a mysteriously-missing action, and matches this project's general preference for explicit empty/blocked states over silently hidden ones (see SCR-009's "honest empty state" precedent).

---

## Status

All Key Product Decisions are now resolved (2026-09-10). Ready to move to UI/UX.
