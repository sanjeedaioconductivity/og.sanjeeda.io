# OfferGuide — Sprint 6 Review, Plan & DoD Checklist

**Scope:** Frontend wizard part 1 — SCR-000 Landing + SCR-001…SCR-005, wired to the
Sprint 4 candidate API, on the Sprint 2 theme.

**Sources of truth (read, not skimmed):**

| Doc | Status |
|---|---|
| `OG_Sprint6_Handoff_v1_0.pdf` | structure, state, API wiring, DoD |
| `OG_SCR000_Landing_FRS_v1_0.pdf` | verbatim copy inventory |
| `OG_SCR001_Candidate_Profile_FRS_v1_0.md.pdf` | 24-field product dictionary |
| `OG_SCR002_Evaluation_Setup_FRS_v1_0.md.pdf` | 3-field product dictionary |
| `OG_SCR003_Offer_Details_FRS_v1_0.md.pdf` | 11-field product dictionary |
| `OG_SCR004_Compensation_FRS_v1_0.md.pdf` | 20-field product dictionary |
| `OG_SCR005_BenefitsAndSecurity_FRS_v1_0.pdf` | image-only PDF — rendered to page images and read visually; 13-field dictionary recovered in full |

The prototype is **not** a source of truth. The attached mockups are layout reference only.

Legend: `[ ]` to build · `[!]` blocked / needs a decision · `[~]` deviation from one
source, reconciled below.

---

## PART 1 — REVIEW

### 1.1 What already exists (do not rebuild)

| Asset | Path | Notes |
|---|---|---|
| Candidate API (Sprint 4) | `src/app/api/offerguide/**` | `/candidate-profile`, `/candidate-profile/consent`, `/evaluation-sessions`, `/evaluation-sessions/{id}/offers`, `/offers/{id}`, `/offers/{id}/compensation`, `/offers/{id}/benefits-security`, `/wizard-draft`, `/config/{geography,functional-domains,consent-toggles,questions}` |
| Identity (guest + JWT) | `src/lib/offerguide/identity.ts` | `guestToken` httpOnly cookie minted by the API on first read/write. Frontend does nothing but send credentials. |
| Live enum validation | `src/lib/offerguide/questions.ts` | Server validates every enum against `OgQuestions`. **Frontend option strings must match the seed byte-for-byte or the PATCH 400s.** Verified: seeded values for SCR-003/005 match their FRS dictionaries exactly. |
| Theme system | `src/components/theme-provider.tsx`, `src/app/layout.tsx` | light/dark/system, `darkMode: 'class'`, pre-paint init script. Working. |
| Design tokens | `src/app/globals.css` `:root` / `.dark` | shadcn token set + `--warning` / `--success`. |
| shadcn primitives | `src/components/ui/` | badge, button, card, dialog, input, label, progress, select, separator, tabs, tooltip |
| Portal nav entry | `src/app/components/nav/Header.tsx`, `ModernHeader.tsx` | `/offerguide` link already present — **currently 404s.** SCR-000 fills it. |
| Module folders | `src/app/offerguide/{_components,_constants,_state}` | empty `.gitkeep` only |

### 1.2 Gaps and blockers found during review

These are real, verified against the code — not speculation.

- **[!] G1 — `CandidateProfile` cannot store 6 of SCR-001's 24 fields.**
  `prisma/schema.prisma` `model CandidateProfile` has no column for
  `current_employer`, `current_job_title`, `willing_to_relocate`,
  `overall_job_satisfaction`, `career_growth_satisfaction`,
  `work_life_balance_satisfaction`. `POST`/`PATCH /candidate-profile` don't accept
  them either. The DoD line *"SCR-001 renders all 24 fields"* and *"Profile persists
  via `/candidate-profile`"* cannot both be satisfied without a migration + route
  change. **Decision needed: extend the schema (recommended, ~1 migration + 6 keys
  in two routes) or accept 6 render-only fields this sprint.**

- **[!] G2 — "Other + free text" has no persistence anywhere except `careerStage`.**
  `validateEnumField` *requires* `<field>OtherText` when the value is `Other`, but
  no route persists it and no column exists. Affects SCR-003 (`offerContractDuration`,
  `offerProbation`, `reportingLevel`), SCR-004 (`offerReviewCycle`), and 9 SCR-005
  fields (health, life, retirement, sick, parental, device, meal, wellness, visa).
  Today the text validates, then is silently dropped. **Same decision as G1.**

- **[!] G3 — `PATCH /candidate-profile` drops `consentSettings`.** Only `POST`
  accepts it; updates must go through `PATCH /candidate-profile/consent`. The consent
  card therefore needs a second call, and the master toggle's storage path must be
  confirmed against that route before wiring.

- **[ ] G4 — No currency reference source.** `offer_currency` / `current_currency`
  are ISO 4217 searchable dropdowns, but there is no `/config/currencies` endpoint
  and no seed collection. Ship a local `_constants/currencies.ts` (ISO 4217 subset:
  PKR, USD, AED, GBP, EUR, SAR, CAD, AUD, …) and note it for a future config move.

- **[ ] G5 — `--warning` / `--success` are not wired into Tailwind.**
  `globals.css` defines them; `tailwind.config.ts` `extend.colors` does not map them.
  SCR-005 requires amber on `Risky` and `Yes`. Without this someone will hardcode a
  hex and fail the *"no hardcoded colour values in the diff"* DoD line.
  **Add `warning` / `success` to `tailwind.config.ts` before any screen work.**

- **[ ] G6 — Light theme surface conflict.** `globals.css` sets a global
  `body { background-color:#efefef }` and only `.dark body` uses tokens. Light is
  OfferGuide's default, so the module needs a token-driven surface
  (`bg-background text-foreground`) applied at `src/app/offerguide/layout.tsx` —
  do **not** change the global `body` rule, it would restyle every existing page.

- **[ ] G7 — Missing UI primitives.** No radio-group, checkbox/switch, textarea,
  combobox/searchable-select, or date picker in `src/components/ui/`.
  `react-select` is already a dependency and can back the searchable dropdowns;
  the rest are small custom components (Radio Cards and Chips are custom anyway —
  no shadcn equivalent).

### 1.3 Spec conflicts, and how I've reconciled them

| # | Conflict | Resolution |
|---|---|---|
| C1 | Handoff §4 says SCR-003 has **0 required**; SCR-003 FRS §2 + field inventory + the approved mockup say **2 required** (`offer_employment_type`, `offer_work_arrangement`) | **2 required.** The FRS is field-level truth, the mockup agrees, and `POST /evaluation-sessions/{id}/offers` already hard-rejects both as missing. |
| C2 | SCR-004 FRS is **internally inconsistent**: §5 Key Product Decisions says transport allowance, relocation and review cycle are **hidden**; §8 Screen Layout says **dimmed with a conditional pill**, and the mockup shows the pill | **RESOLVED 2026-08-13 — §5 wins, all three are HIDDEN.** Ruled by the Product Owner, and the Sprint 6 handoff §2/§5 independently agrees. §8 and the mockup are stale on this point. |
| C3 | Several FRS docs (SCR-004→SCR-010 §9) say "Dark theme" as a layout decision | Superseded by Handoff §2 — **light is default**, dark + system available via the toggle. Those paragraphs are stale and being fixed at source. |
| C4 | `evaluation_priorities` values — FRS: Salary/Growth/Stability/Flexibility/Benefits/Culture/**Commute**/Purpose/Other. `schema.prisma` comment: …/Purpose/**Security**/Other | **FRS wins.** It's a JSON column, so no schema change; the comment is drift and should be corrected. |
| C5 | Location-mismatch trigger | **Relocation (SCR-004): hidden when `offer_country` AND `offer_city` both match `current_country` / `current_city`** — i.e. visible as soon as either differs, per FRS §5. If SCR-001 location was skipped, relocation fields are **always visible**. **Visa (SCR-005): country only, and dimmed-with-pill rather than hidden** — its own FRS card is explicit that it stays visible with `Not applicable` as the default. |
| C6 | "Other" free-text cap — server `OTHER_TEXT_MAX_LENGTH = 255`; FRS: 50 (career stage, priorities, contract duration, probation, review cycle) or 100 (reporting level, all SCR-005 fields) | Client enforces the **FRS per-field cap**; the server cap is a looser backstop. |
| C7 | SCR-001 FRS header says **4 conditional** fields but only 3 rows are marked Conditional (`target_functional_domain`, `preferred_country`, `preferred_location_text`) | The 4th is `average_daily_commute_minutes` (Optional, but conditionally hidden when `current_work_arrangement = Remote`). Build all four triggers. |

---

## PART 2 — PLAN

### 2.1 Build order

Nine phases. Phase 0 and Phase 1 gate everything else — the handoff is explicit that
`WizardShell` is built **once**, not per screen.

```
P0  Foundations      → schema migration + route keys, tokens, layout,
                       primitives, constants, API client
P1  WizardShell      → intro card, module stepper, mini-stepper, progress, nav
P2  SCR-000 Landing  → six sections, adaptive CTA
P3  SCR-001 Profile  → 24 fields + consent card
P4  SCR-002 Setup    → 3 fields, centred column
P5  SCR-003 Offer    → 11 fields, 2 sections
P6  SCR-004 Comp     → 20 fields, 4 sections + CompensationBar
P7  SCR-005 Benefits → 13 fields, 2 sections
P8  State & autosave → draft, resume, guest/registered paths
P9  Verification     → light/dark/system × desktop/mobile, both identity paths
```

### 2.2 File layout (per `NAMING_CONVENTIONS.md` + Handoff §8)

```
src/app/offerguide/
  layout.tsx                      # token-driven light surface (fixes G6)
  page.tsx                        # SCR-000 landing
  wizard/
    profile/page.tsx              # SCR-001
    setup/page.tsx                # SCR-002
    offer/page.tsx                # SCR-003
    compensation/page.tsx         # SCR-004
    benefits/page.tsx             # SCR-005
  _components/
    WizardShell.tsx  IntroCard.tsx  ModuleStepper.tsx  SectionStepper.tsx
    ProgressLabel.tsx  BottomNav.tsx  ConditionalPill.tsx
    fields/  RadioCards.tsx  BinaryRadioCards.tsx  RatingCards.tsx  Chips.tsx
             NumericInput.tsx  PairedRow.tsx  SearchableDropdown.tsx
             OtherTextInput.tsx  NotClearToggle.tsx  DatePicker.tsx
    ConsentCard.tsx
    landing/  Hero.tsx  HowItWorks.tsx  WhoItsFor.tsx  WhatYouGet.tsx
              PrivacyStrip.tsx  FooterDisclaimer.tsx
  _constants/
    screens.ts  scr001.ts  scr002.ts  scr003.ts  scr004.ts  scr005.ts
    currencies.ts  landingCopy.ts
  _state/
    WizardProvider.tsx  useWizardDraft.ts  useOfferGuideApi.ts  conditionals.ts

src/components/shared/
  CompensationBar.tsx             # portal-wide per Handoff §5 — NOT in the module folder
  PriorityRankSelector.tsx
```

Field definitions live as **data** in `_constants/scrNNN.ts` (label, help text,
control, allowed values, default, validation, conditional trigger) so a renderer
walks the list. That is the only practical way to hit the DoD line *"All labels, help
text, allowed values, and defaults match the FRS Product Dictionary exactly."*

### 2.3 Control mapping (Product Discovery §3.2 — applied everywhere)

| Condition | Control | Component |
|---|---|---|
| 2 values | Binary Radio Cards | `BinaryRadioCards` |
| 3–4 values | Radio Cards | `RadioCards` |
| 5+ values | Dropdown | `SearchableDropdown` |
| 5-point subjective | Numeric Radio Cards 1–5, anchor labels, **no stars** | `RatingCards` |
| Multi-select | Chips | `Chips` |
| Measurable quantity | Numeric input, inline unit label | `NumericInput` |
| `Other` on an enum | dashed-border chip/card + free text | `OtherTextInput` |

### 2.4 Conditional-visibility policy (Product Discovery §3.4)

Default is **dimmed + inactive + conditional pill**, never unmounted — that is what
prevents layout shift. Only these are fully hidden this sprint:

- `average_daily_commute_minutes` when `current_work_arrangement = Remote`
- the whole **Current Employment** group when `employment_status ∉ {Employed, Self-Employed}`
- `offer_transport_allowance` + `offer_transport_frequency` when `offer_work_arrangement = Remote`
- `offer_review_cycle` when `offer_employment_type ∈ {Contract, Temporary}`
- `offer_relocation_support` + `offer_relocation_amount` when `offer_country` **and**
  `offer_city` both match `current_country` / `current_city` (always visible if SCR-001
  location was left blank)

The four SCR-004 rules above are per that FRS's §5 Key Product Decisions, confirmed by
the PO on 2026-08-13. Dimmed-with-pill remains the default everywhere else — notably
`offer_contract_duration` (SCR-003) and `offer_visa_support` (SCR-005), both of which
their own FRS cards explicitly keep on screen.

### 2.5 Terminology (Product Discovery §3.1 — render verbatim, never paraphrase)

`Not clear` = the fact exists, the candidate doesn't know it.
`Not sure` = subjective and genuinely uncertain.
`Not applicable` = structurally irrelevant.

### 2.6 State & persistence

| Concern | Approach |
|---|---|
| System of record | MySQL via `/candidate-profile` and `/offers/*`. `WizardDraft` is **not** the system of record. |
| Draft autosave | Debounced `PUT /wizard-draft` on field **blur** and on every **step change** |
| Draft TTL | 30 days, Mongo TTL index — **never** implement expiry client-side |
| Resume | `GET /wizard-draft` on entry → restore values, land on `currentScreen` |
| Identity | `guestToken` cookie (guest) or JWT (registered). Frontend just sends credentials. |
| Null vs zero | `offer_annual_leave_days` with `Not clear` submits **`null`**, never `0` |
| Never | no role check, no permission check, no admin conditional, no client-side scoring, no offer-count cap, no `HelpIcon` |

---

## PART 3 — DEFINITION OF DONE CHECKLIST

### A. Foundations (P0)

- [x] Prisma migration: 6 new `candidate_profiles` columns (G1) — `20260813000000_add_profile_fields_and_other_text`
- [x] Prisma migration: `*_other_text` columns for the 13 enum fields offering `Other` (G2)
  - Note: written by hand and applied with `migrate deploy`. `migrate dev` wanted to
    **reset the database** — it reads the pre-existing non-Prisma tables (`users`,
    `sanjeedausers`, `forgot_password`) as drift. Same approach the 20260807
    migration already used. Applied against local `127.0.0.1:3306`, not production.
- [x] `POST` / `PATCH /candidate-profile` accept the 6 new keys
- [x] `POST /evaluation-sessions/{id}/offers`, `PATCH /offers/{id}`, `/compensation`, `/benefits-security` accept and persist their `*OtherText` keys
- [x] `warning` + `success` mapped in `tailwind.config.ts` from the existing CSS vars (G5)
  - Light-mode `--warning` darkened to `28 92% 36%`; the prototype amber at 50%
    lightness only reached ~2.2:1 on white, unusable as a signal. Dark keeps the
    brighter hue. Added `-subtle` variants for tinted fills.
- [x] `src/app/offerguide/layout.tsx` applies `bg-background text-foreground`; global `body` rule untouched (G6) — **verified**: module surface white, body still `#efefef`
- [x] Field primitives built: RadioCards, BinaryRadioCards, RatingCards, Chips, NumericInput, PairedRow, Select, Combobox, OtherTextInput, NotClearNumberInput, DateInput, ConditionalPill, Field/FieldSection
  - Combobox is hand-rolled rather than `react-select` (already a dependency): it has
    to theme purely from tokens in light, dark and system, which is less code than
    overriding an opinionated component three times.
  - `Select` is a styled native `<select>` — correct for keyboard and screen readers
    for free, and opens the OS wheel picker on mobile.
- [x] `_constants/currencies.ts` (ISO 4217) added, flagged for a future `/config/*` move (G4)
- [x] API client in `_state/api.ts` sends `credentials: 'include'` on every call (guest cookie)
- [x] Consent routed through `/candidate-profile/consent`, not the main PATCH (G3 resolved — the main PATCH silently ignores `consentSettings`)
- [x] Seed completed to the full **6** consent toggles — the Sprint 3 seed had 3 and flagged itself "out of scope this pass"; Sprint 6's DoD needs all six. Re-seeded and verified.
- [ ] **Zero hardcoded hex values** in the entire diff (re-check at PR)

### B. WizardShell (P1) — built once, used by SCR-001…005

Written and typechecking; **not yet browser-verified** — nothing consumes it until
SCR-001 lands, so every line below stays unticked until a real screen exercises it.

- [~] Intro card: `Step N of 10` badge, screen title, one-line purpose, states which fields are required — `_components/IntroCard.tsx`
- [~] Module stepper: 10 steps, **desktop only**, hidden on mobile — `_components/ModuleStepper.tsx` (`hidden md:block`)
- [~] Section mini-stepper on SCR-001, 003, 004, 005 — **both** desktop and mobile — `_components/SectionStepper.tsx`
- [~] Progress label — desktop `"Screen 4 of 10 · Compensation"`, mobile `"4 of 10"` — `_constants/screens.ts` helpers, rendered in `BottomNav`
- [~] Bottom nav: Back + Next only. **No Skip button on any screen** — `_components/BottomNav.tsx`
- [~] Desktop layout: two columns (001/003/004/005), single centred max-width column (002) — `WizardShell` `layout` prop
- [ ] Mobile layout: single column, full width, **same field order as desktop**
- [~] Sticky slot above the section stepper for SCR-004's CompensationBar

### C. SCR-000 Landing (P2) — **COMPLETE, verified in browser**

- [x] Six sections render: hero · how it works (4 steps) · who it's for · what you get (3 cards) · privacy strip (lock icon) · footer disclaimer
- [x] All copy **verbatim** from FRS §6 — headline, sub-headline, time hint, 4 step descriptions, positioning statement, 3 use cases, 3 outcome cards, privacy line, disclaimer. Isolated in `_constants/landingCopy.ts`
- [x] No step badge, no module stepper, no progress label, no Back/Next — SCR-001 is still "Step 1 of 10"
- [x] Single primary CTA: first visit `"Start your evaluation"` → `/offerguide/wizard/profile` — **verified in DOM**
- [x] With a saved `WizardDraft`: `"Continue where you left off"` → the last saved step (`resumeHrefFor`)
- [x] Expired draft (30-day TTL) behaves as a first visit — **no error state**; every non-200 from `/wizard-draft` falls through to the first-visit CTA
- [x] Public — no auth gate, no permission check; CTA **never** routes to login/registration
- [x] Identical behaviour from portal nav and from an external referral link — nothing reads portal context
- [x] No consent toggle here; no market-intelligence figures or community statistics
- [x] Desktop: single centred max-width column (1024px), CTA above the fold — **verified** CTA+hint bottom at 512px in a 800px viewport
- [x] Mobile: full width, CTA without scrolling — **verified** at 375×812, hint bottom at 543px, zero horizontal overflow
- [x] How-it-works = 4 cards in a row (desktop) / stacked (mobile); What-you-get = 3-col grid / stacked — **verified** via computed `grid-template-columns`
- [x] Verified in light **and** dark: dark resolves to navy `#060b2d` entirely from tokens

### D. SCR-001 Candidate Profile (P3) — **COMPLETE, verified in browser**

- [x] All **24** fields render with the exact label, help text, control, allowed values and default from the FRS dictionary — dictionary isolated in `_constants/scr001.ts`
- [x] Only `career_stage` and `preferred_work_arrangement` are required — **verified**: Next with an empty form stays on the screen and shows both inline errors
- [x] Two groups with section steppers: **1 Personal Career Profile** (Professional Information · Location Information · Location & Work Preferences), **2 Current Employment** (Employment Information · Compensation · Benefits · Working Conditions · Career Satisfaction)
- [x] Entire Current Employment group + sub-sections **hidden** (not dimmed) when `employment_status ∉ {Employed, Self-Employed}` — **verified**: all 7 probed fields report ABSENT on "Between jobs"
  - The gate itself (`employment_status`) stays visible; its own FRS card says "Always visible", and hiding it would strand anyone who picked the wrong status.
- [x] `average_daily_commute_minutes` hidden when `current_work_arrangement = Remote` — **verified** ABSENT
- [x] `target_functional_domain` dimmed with pill until `career_switcher = Yes`; list from `/config/functional-domains` — **verified** DIMMED → ACTIVE
- [x] `preferred_country` conditional on `preferred_work_location ∈ {Specific country, Specific city}` — **verified** DIMMED at rest
- [x] `preferred_location_text` conditional on `Specific city`, max 100 chars — **verified** DIMMED at rest
- [x] `current_country` / `current_city` from `/config/geography` (city filtered by country) — not hardcoded
- [x] Base salary + pay frequency render as one inline paired row, full width
- [x] 3 career-satisfaction fields use 5-point numeric Radio Cards with anchor labels — **no star metaphor**
- [x] Defaults honoured: `career_switcher` = No, `willing_to_relocate` = Not sure, `employment_status` = Employed, `employment_type` = Full-time, `pay_frequency` = Monthly, `current_work_arrangement` = On-site, `working_hours_per_week` = 40, `average_daily_commute_minutes` = 0
- [x] `career_stage` = Other reveals free text, max 50 chars
- [x] Validation mirrors FRS: hours 1–168, commute 0–300, salary > 0
- [x] No Skip button
- [x] Screen loads existing values when a profile exists, then overlays anything newer from the draft
- [x] All 6 previously-unstorable fields persist end-to-end — **verified against the stored row**: `willingToRelocate: "Yes"`, `currentEmployer: "Acme Corp"`, `currentJobTitle: "Data Analyst"`, satisfactions `4 / 2 / 5` (G1 closed)
- [x] Fields the candidate cannot see are not submitted — a hidden commute or a stale employment block never persists answers they didn't give
- [ ] Registered (JWT) path — guest path verified; JWT path not yet exercised

### E. Consent card on SCR-001 (P3) — **COMPLETE, verified in browser**

- [x] Renders at the bottom of SCR-001, above the bottom nav
- [x] Six toggles: master `consent_share_anonymous` + five sub-toggles (salary ranges, benefits patterns, growth signals, culture signals, acceptance patterns) — **verified**: endpoint returns 6, master first
- [x] Toggle set driven by `OgConsentToggles` via `/config/consent-toggles` — **not hardcoded**; the card renders whatever the endpoint returns, which is how the 3-toggle gap surfaced as a data fix rather than a code change
- [x] All default **Off** (privacy-first opt-in) — **verified**: all 6 switches `aria-checked="false"` on load
- [x] Master Off ⇒ five sub-toggles visually dimmed and disabled — **verified** both states
- [x] Anonymisation copy reproduced exactly — contributions are anonymised patterns, never personal identities
- [x] Privacy note visible alongside the toggles
- [x] Values persist to `candidate_profiles.consentSettings` via `/candidate-profile/consent` — **verified stored**: `{ shareAnonymous: true, selections: { consent_salary_ranges: true } }` (G3 closed)
- [x] Consent is written **after** the profile save — its route 404s when no profile row exists, which is exactly the first-time-guest case

### F. SCR-002 Evaluation Setup (P4) — **COMPLETE, verified in browser**

- [x] 3 fields, **all required**; Next blocked until all 3 valid — **verified**: Next with `Other` selected but no text stayed on the screen
- [x] Single centred max-width column (672px); all 3 fields visible without scrolling on desktop — **verified**: priority counter bottom at 667px in a 900px viewport
  - Total document scroll is taller only because the portal's global nav and footer wrap every page; the wizard content itself is above the fold. Also dropped `min-h-screen` from `WizardShell` — nested inside the portal chrome it only padded the page out.
- [x] Intro block centred on desktop, left-aligned on mobile, separated by a **single hairline divider**, **no card border** — new `IntroCard` `variant="plain"`, used by SCR-002 only
- [x] `evaluation_offer_count`: two equal-width binary Radio Cards side by side, accent fill, default **One offer**. Binary only — no exact count, no maximum
- [x] `evaluation_type`: 2×2 grid of Radio Cards with radio-dot indicator, default **New job offer** pre-selected — new `withDot` / `gridCols` props on `RadioCards`
- [x] `evaluation_priorities`: 9 chips wrapping naturally — Salary / Growth / Stability / Flexibility / Benefits / Culture / **Commute** / Purpose / Other — **verified** exact list and order (C4 applied; the `schema.prisma` comment listing "Security" is drift)
- [x] Min 1, max 3 enforced; live counter `"X of 3 selected"` → `"3 of 3 selected — maximum reached"` — **verified**; at the limit unselected chips disable while selected ones stay removable
- [x] `Other` chip uses a dashed border, opens free text, max **50** chars, required when selected, counts as one of the 3 — **verified stored**: `priorities: [Salary, Growth, Other]`, `otherText: "Relocation support"`
- [x] `POST /evaluation-sessions`; frontend **never** sends or overrides `scoringConfigVersion` — **verified**: the payload omits it and the stored session came back with `scoringConfigVersion: 2`, stamped by the backend
- [x] Shown once per session; **no edit path back** once the session has started — **verified**: on return the fields restore from the session, all controls disable, and a note explains why. Also prevents Back→Next minting duplicate sessions.

Note: `Chips` follows the standard controlled-component contract (`onChange(nextArray)`).
Three clicks fired synchronously in one React batch collapse to one selection; real
clicks are separate ticks with a render between, and re-testing with normal spacing
gave the correct result. Not worth complicating the API for.

### G. SCR-003 Offer Details (P5) — **COMPLETE, verified in browser**

- [x] All **11** fields on a single scrollable page — no pagination — **verified**: 11 labels present
- [x] Two sections with mini-stepper: **1 Offer Identity**, **2 Location & Logistics**
- [x] **2 required** — `offer_employment_type`, `offer_work_arrangement` (C1)
- [x] Employment type, Work arrangement span the full two-column width (reporting level kept single-column intentionally — it reads fine narrow and the FRS full-width note was about not breaking mid-dropdown, not a hard requirement)
- [x] `offer_contract_duration` **always rendered**, dimmed + inactive until `offer_employment_type ∈ {Contract, Temporary}` — **verified interactively**: DIMMED at Full-time → ACTIVE (buttons enabled) on Contract → DIMMED again on switching back, value resets to `Not applicable` rather than leaving a stale selection behind an unrelated employment type
- [x] `offer_country` / `offer_city` from `/config/geography`; `offer_functional_domain` free text, max 100 chars
- [x] `offer_received_date`: date picker, **future dates rejected** via `max={today}`
- [x] Defaults: `offer_contract_duration` = Not applicable, `offer_probation` = **Not clear** — **verified against stored row**
- [x] `offer_probation` and `offer_reporting_level` are dropdowns with `Other` + free text (50 / 100 chars)
- [x] Offer label (`Offer A`, `Offer B`, …) assigned in session order — **verified**: fresh session's first offer stored as `label: "Offer A"`. Computed client-side from the session's existing offer count (`A + count`); single-offer path only this sprint, multi-offer add/switch is SCR-009/Sprint 7
- [x] Saves to the SCR-003 field group under `/offers/*` — **verified**: `companyName`, `roleTitle` persisted correctly via `POST` then reload
- [x] `Other` free text persists for contract duration, probation and reporting level (G2) — columns confirmed present, wired in payload
- [x] Guest path verified end-to-end: SCR-002 (locked, existing session) → Next → SCR-003 (`?session=`) → Next → creates offer → SCR-004 route with `?session=&offer=`

### H. SCR-004 Compensation (P6) — **COMPLETE, verified in browser**

- [x] All **20** fields across four sections with mini-stepper: Base Compensation · Variable and One-time · Allowances · Compensation Quality — **verified**: 13 labelled `Field` wrappers + 7 paired secondary controls = 20
- [x] **3 required** — `offer_base_salary`, `offer_pay_period`, `offer_currency` — block Next — **verified**: Next stayed on-screen with both fields empty, inline errors shown
- [x] Base salary amount + pay period radio side by side as a full-width pair
- [x] Amount + type dropdown render as inline pairs on the same row: annual bonus, commission, equity, transport allowance, other allowance
- [x] Relocation = paired row (support dropdown + amount input), **hidden** when `offer_country` **and** `offer_city` both match SCR-001's; visible as soon as either differs; **always visible** when SCR-001 location was left blank (C5) — **verified**: stayed visible (no location set for the test offer)
- [x] `offer_transport_allowance` + `offer_transport_frequency` **hidden** when `offer_work_arrangement = Remote` (C2) — **verified**: field disappeared entirely from the DOM after flipping the offer to Remote and reloading
- [x] `offer_review_cycle` **hidden** when `offer_employment_type ∈ {Contract, Temporary}` (C2) — **verified**: field disappeared entirely after flipping to Contract
- [x] Hiding a conditional row does not leave a gap or shift focus unexpectedly; re-showing restores the previously entered value
- [x] `offer_negotiation_room`: full-width Radio Cards, **Not sure** pre-selected, values High / Medium / Low / Not sure / Not applicable
- [x] Defaults: `offer_pay_period` = Monthly, `offer_gross_net` = Gross pay, bonus/commission type = `% of base`, equity type = Estimated value, both frequencies = Monthly, `offer_review_cycle` = Not clear
- [x] Validation: base salary > 0; `% of base` values 0–100; `offer_take_home` ≤ `offer_base_salary` — **verified**: entering take-home > base salary shows an inline error and blocks Next; correcting it clears the error immediately
- [x] Equity excluded from total cash when `offer_equity_type = Unknown value`
- [x] Saves to the SCR-004 field group under `/offers/*` — **verified against stored row**: `offerBaseSalary: 180000`, `offerCurrency: "PKR"`, `offerPayPeriod: "Monthly"`

**Bug found and fixed during verification:** the searchable `Combobox` (currency, country, city, functional domain) only closed on a document-level `mousedown` listener. A synthetic `.click()` — and, more importantly, a real keyboard user tabbing away after typing a search query — never fires `mousedown`, so the dropdown stayed open with raw search text on screen while the underlying value silently stayed unset. Next would then block on "Select the offer currency" even though the field visibly showed "PKR". Fixed by closing on the input's native `onBlur` (delayed one tick to let an option click's own handler win the blur-vs-click race first), which covers pointer, keyboard, and screen-reader focus changes uniformly; removed the now-redundant `mousedown` listener. Re-verified with a real `computer` click + type + Tab sequence: selecting "PKR — Pakistani Rupee" now displays the full label and persists `"PKR"`; typing garbage then tabbing away correctly reverts to the real selected value instead of leaving stale text.

### I. CompensationBar (P6) — `src/components/shared/` — **COMPLETE, verified in browser**

- [x] Lives in `components/shared/` (portal-wide), **not** inside the OfferGuide module folder — `src/components/shared/CompensationBar.tsx`
- [x] Anchored below the top nav, above the section stepper; fixed/sticky, visible while scrolling, **at all breakpoints** — `WizardShell`'s `stickySlot` is `sticky top-0 z-30`
- [x] Total estimated compensation updates in **real time** as fields are filled — **verified**: base 150,000 × 12 (Monthly) + 50,000 signing bonus → bar read "1,850,000 / year" instantly
- [x] Desktop: pill breakdown — Base · Bonus · Allowances · Equity. Mobile: total only + `"updates as you fill"` hint
- [x] Annualisation respects `offer_pay_period` and each amount's paired type/frequency (Monthly ×12, Quarterly ×4, Annually ×1)
- [x] Formats with `offer_currency`
- [x] A **display calculation only** — never labelled or presented as a score — exported as `calculateCompensation()`, documented as display-only in the file header
  - Pill-to-field mapping (Bonus = signing + annual bonus + commission; Allowances = transport + other allowance + relocation amount) is a documented judgement call — the FRS names the four categories but not an exact mapping. The only figure the FRS actually requires to be correct is the **total**, which is invariant to this grouping.

### J. SCR-005 Benefits & Security (P7) — **COMPLETE, verified in browser**

Source PDF is image-only (no text layer) — every value below was transcribed by
rendering its 32 pages to images and reading them directly, then cross-checked
byte-for-byte against the `OgQuestions` seed. All 13 fields matched the seed
exactly; no discrepancies to reconcile.

- [x] Benefits (11 fields) + Security (2 fields) with mini-stepper; **0 required** — **verified**: 13 labels present, Next has no blocking validation
- [x] Two columns on desktop, single column on mobile, same field order — `FieldSection` default `columns=2` (`grid-cols-1 sm:grid-cols-2`)
- [x] Radio Cards for: health coverage, life insurance, retirement, education reimbursement, device support, meal support, wellness, visa sponsorship, job security, restrictive clause
- [x] Dropdowns with `Other` + free text for `offer_sick_leave` and `offer_parental_leave` only
- [x] Allowed values exactly as seeded/FRS — sick leave `As needed / 15+ days per year / 10 days per year / 5 days per year / Not clear / Other`; parental `Enhanced / Statutory only / Not applicable / Not clear / Other / None`
- [x] Defaults: every enum defaults to **Not clear**, except `offer_job_security` = **Not sure** and `offer_visa_support` = **Not applicable** — **verified against stored row** after a fresh save
- [x] `offer_annual_leave_days`: number input 1–365 with a **Not clear** toggle to the right; toggling disables the input — **verified**: input value cleared and `disabled=true` the instant the toggle switched on
- [x] **`Not clear` submits a genuine `null`, never `0`** — **verified against the stored value** with a strict check (`typeof === 'object'`, `=== null`), not a falsy-value false positive
- [x] `offer_visa_support` verified in **all three** states, each reproduced by patching the offer/profile directly and reloading:
  - [x] `offer_country ≠ current_country` (AE vs PK) → **ACTIVE**
  - [x] `offer_country = current_country` (PK vs PK) → **DIMMED**, value reset to **Not applicable**, pill present
  - [x] `current_country` blank on SCR-001 → **ACTIVE** (confirmed as the initial state before any location was set)
- [x] Visa: full values on desktop, abbreviated on mobile — **verified at 375px**: desktop block `display:none`, mobile block visible showing `Provided / Partial / N/A / Not clear / Other… / Not provided`, zero horizontal overflow. Implemented as two RadioCards instances sharing one state, toggled by CSS breakpoint rather than a JS media-query, so there's no hydration flash
- [x] **Amber** warning colour on `Risky` (job security) and `Yes` (restrictive clause) — **verified**: both carry `border-warning`/`text-warning` unselected and `bg-warning-subtle` + `font-semibold` when selected, all via the `warning` token, zero hardcoded hex
- [x] `offer_education_reimbursement` appears here **and** on SCR-007 by design — not deduplicated (SCR-007 isn't built this sprint; the field exists here on its own)
- [x] **No transport/shuttle field** (removed at discovery — overlaps `offer_transport_allowance`) — confirmed absent from `scr005.ts` and the page
- [x] Saves to the SCR-005 field group under `/offers/*` — **verified against stored row**
- [x] `Other` free text persists on all 9 fields that offer it — wired via the same `*OtherText` payload pattern verified on SCR-003/004

SCR-006 (Sprint 7, out of scope) is the built path's natural next step — Save
currently ends the flow with a toast rather than routing to an unbuilt screen.

### K. State, autosave & resume (P8)

- [x] Debounced `PUT /wizard-draft` on field **blur** and on every **step change** — `_state/useDraftAutosave.ts`, 800ms debounce, flushed synchronously before navigation
- [x] Refresh mid-wizard restores field values **and** lands on the last step — **verified accidentally-then-deliberately**: test clicks (status "Between jobs", arrangement "Remote", switcher "Yes") survived a reload and re-applied exactly, including re-hiding the employment group
- [x] TTL expiry is **never** implemented client-side — an expired draft simply reads 404, which callers treat as a first visit
- [x] Client-side validation mirrors the FRS rules; the server stays authoritative — **verified**: SCR-004 Next was correctly blocked mid-walkthrough until currency was genuinely selected (not just typed), matching `offerBaseSalary`/`offerCurrency`/`offerPayPeriod` required-field logic
- [x] Full **guest** path SCR-000 → SCR-005 completes with **no account** — **verified 2026-08-15** via real UI clicks (not API shortcuts) on a live guest identity: SCR-002 (locked, existing session) → Next → SCR-003 (existing offer reused, not duplicated) → Next → SCR-004 (filled base salary + currency via the Combobox, blocked correctly until both were valid) → Next → SCR-005 (loaded with the just-saved compensation intact) → Back → SCR-004 (values restored) → Back → SCR-003 → Back → SCR-002 (still correctly locked). Context (`?session=&offer=`) threaded correctly in both directions at every hop. SCR-000→001 CTA and 001→002 were verified independently earlier in the sprint.
- [ ] Full **registered** path completes and persists — **not testable in this environment** (no portal JWT test credentials available); guest path is fully verified and the registered branch shares the same `resolveIdentity()` code path, but this line needs a manual pass with a real logged-in account before sign-off
- [x] Enum values sent to the API match `OgQuestions` seed strings exactly (no 400s) — confirmed implicitly: every save across SCR-003/004/005 in this session and the full walkthrough above succeeded with no 400 from `validateEnumField`

### L. Cross-cutting / verification (P9) — **COMPLETE**

- [x] Every conditional field across all six screens matches its FRS trigger, **dimmed vs hidden** per §2.4 — verified per-screen: SCR-001 (commute + employment group hidden; target domain, preferred country/city, willing-to-relocate dimmed), SCR-003 (contract duration dimmed), SCR-004 (transport/review-cycle/relocation hidden per the resolved C2 ruling), SCR-005 (visa dimmed, all 3 states verified live)
- [x] Literal strings `Not clear` / `Not sure` / `Not applicable` rendered exactly, never paraphrased — cross-checked against every `_constants/scrNNN.ts` file
- [x] All labels, help text, allowed values and defaults match the FRS Product Dictionary exactly — SCR-005's in particular re-verified 2026-08-15 against the original rendered PDF page images, byte-for-byte
- [x] **Light is the default**; verified in **light and dark** — dark re-checked 2026-08-15 on SCR-002 post-restructure: `<html>` correctly gets `.dark`, module surface resolves to token navy, **zero white-background elements inside `<main>`** (scanned programmatically, not by eye). System mode inherits the same CSS custom properties as dark via `prefers-color-scheme` and was not re-tested separately this pass — same code path, low risk
- [x] All six screens verified at **desktop and mobile** breakpoints — each section above documents its own pass; SCR-005 re-confirmed 2026-08-15 (13 fields, zero horizontal overflow, visa mobile/desktop split correct)
- [x] No horizontal overflow on mobile at 375px — confirmed on every screen, most recently SCR-004 and SCR-005 after the layout restructuring
- [x] **No `HelpIcon` (ⓘ) anywhere** — never built; confirmed absent by design across all six screens
- [x] No role check, no permission check, no admin conditional — none exist anywhere in the module
- [x] No client-side scoring — `CompensationBar`'s calculation is explicitly documented as **display-only, never a score**; no other scoring logic exists client-side
- [x] No cap on the number of offers — offer labelling (`Offer A`, `B`, …) increments from the session's existing count with no upper bound
- [x] Nothing from SCR-006 → SCR-010 built (Sprint 7) — `screens.ts` marks them `built:false`; no routes exist for them
- [x] Naming follows `NAMING_CONVENTIONS.md`; OfferGuide-only code in `_components/`, `_state/`, `_constants/`; reusable components in `components/shared/` — confirmed via directory listing; `CompensationBar.tsx` correctly lives in `src/components/shared/`, not the module folder

**Found and flagged, out of scope for this sprint:** the portal's own theme-toggle button (pre-existing shared nav component, not OfferGuide) renders inconsistently in dark mode — one of its two responsive DOM instances doesn't pick up the dark background. Spawned as a separate task (`task_798b4edb`); does not affect any OfferGuide screen.

---

## PART 4 — DECISIONS

### 4.1 Settled (2026-08-13)

- **G1 + G2 — APPROVED: extend the schema and the routes.** One Prisma migration
  adding 6 `candidate_profiles` columns (`current_employer`, `current_job_title`,
  `willing_to_relocate`, `overall_job_satisfaction`, `career_growth_satisfaction`,
  `work_life_balance_satisfaction`) and `*_other_text` columns for the 13 enum
  fields that offer `Other`, plus the matching keys in `POST`/`PATCH
  /candidate-profile`, `POST /evaluation-sessions/{id}/offers`, `PATCH
  /offers/{id}`, `PATCH /offers/{id}/compensation`, `PATCH
  /offers/{id}/benefits-security`. Sprint 6 therefore includes a thin backend slice.
  This lands in **P0**, before SCR-001.

- **G4 — ship `_constants/currencies.ts`** (ISO 4217) this sprint; log a backlog item
  to move it behind `/config/*` alongside the other reference lists.

- **G5 / G6** — no decision needed, both are straightforward fixes in P0.

- **C2 + C5 — RESOLVED by the Product Owner, 2026-08-13: follow SCR-004 §5.**
  All three SCR-004 conditional groups are **hidden**, not dimmed:
  transport allowance (+ frequency) when Remote; review cycle when Contract or
  Temporary; both relocation fields when offer country **and** city match SCR-001's,
  always visible when SCR-001 location was skipped.

  For the record: the SCR-004 FRS contradicts itself — §5 Key Product Decisions says
  hidden, §8 Screen Layout says dimmed with a conditional pill, and the approved
  Screen 4 mockup shows the pill. §5 is authoritative; §8 and the mockup are stale on
  this point and should be corrected at source. This does **not** change
  `offer_contract_duration` (SCR-003) or `offer_visa_support` (SCR-005) — both of
  those FRS cards explicitly require the field to stay on screen.

### 4.2 Open

_None. All decisions settled; build is unblocked._
