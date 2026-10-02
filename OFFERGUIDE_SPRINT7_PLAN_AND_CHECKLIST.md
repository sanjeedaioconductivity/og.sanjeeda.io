# OfferGuide — Sprint 7 Review, Plan & DoD Checklist

**Scope:** Complete the candidate wizard — SCR-006 → SCR-010 — introducing the
`HelpIcon` standard and rendering scoring-engine output end to end.

**Sources of truth (all read, field-level):**

| Doc | Notes |
|---|---|
| `OG_Sprint7_Handoff_v1_0.pdf` | structure, components, API wiring, DoD |
| `OG_SCR006_Work_Life_FRS_v1_0.md.pdf` | 12 fields |
| `OG_SCR007_Growth_FRS_v1_0.md.pdf` | 12 fields |
| `OG_SCR008_Culture_Manager_FRS_v1_0.md.pdf` | 12 fields per FRS — **schema has 14**, see C1 |
| `OG_SCR009_Compare_FRS_v1_0.md.pdf` | 0 input fields (read-only + consent reminder) |
| `OG_SCR010_Results_FRS_v1_0.md.pdf` | 0 input fields (fully generated) |

Every enum value below was cross-checked against the **`OgQuestions` seed**, which
is what `validateEnumField` actually rejects writes against — not just the FRS prose.

---

## PART 1 — REVIEW

### 1.1 What already exists (do not rebuild)

| Asset | State |
|---|---|
| `WizardShell`, `SectionStepper`, `IntroCard`, `BottomNav`, `ModuleStepper` | ✅ Built in Sprint 6, reused verbatim |
| Field primitives (`RadioCards`, `RatingCards`, `Chips`, `Select`, `Combobox`, `NumericInput`, `NotClearNumberInput`, `OtherTextInput`, `PairedRow`, `Field`) | ✅ All exist; `RatingCards` already does 1–5 with anchors, no stars |
| `useWizardContext`, `useDraftAutosave`, `useReferenceData`, `api.ts` | ✅ Built |
| `PATCH /offers/{id}/worklife` | ✅ Accepts all **12** SCR-006 fields |
| `PATCH /offers/{id}/growth` | ✅ Accepts all **12** SCR-007 fields |
| `PATCH /offers/{id}/culture` | ✅ Accepts all **14** SCR-008 fields |
| `POST /offers/{id}/score` | ✅ Computes + persists; returns the full `OfferScoreResult` |
| Prisma `OfferWorkLife` / `OfferGrowth` / `OfferCulture` | ✅ All columns present |
| `shadcn` Tooltip primitive (`src/components/ui/tooltip.tsx`) | ✅ Present — `HelpIcon` wraps this |
| `CompensationBar` in `components/shared/` | ✅ Sprint 6 precedent for shared-component placement |

**Backend for SCR-006/007/008 is complete.** Unlike Sprint 6 (which needed a
schema migration), these three screens are pure frontend work.

### 1.2 Blockers and gaps found

- **[ ] B1 — SCR-010's strengths / watch-outs / next steps need a backend
  derivation step. Fully specified — no product decision needed.**

  `OfferScoreResult` (`scoring/scoreOffer.ts`) currently returns only the 7
  category scores, `overallScore`, `recommendationLabel`, `scoreBreakdown` and two
  version stamps. `offer_scores` has no columns for the three lists.

  This is an **implementation gap, not a specification gap.** SCR-010 §6.3–6.5
  give the complete rules:

  | List | Trigger | Sort | Max | Empty state |
  |---|---|---|---|---|
  | Strengths | category score **≥ 75** | descending | 4 | "No categories scored above 75." |
  | Watch-outs | Salary<60 · Work-life<60 · Culture<60 · `offer_annual_bonus_type = % of base` **and** bonus populated · `offer_overtime_compensation = Not clear` · `offer_restrictive_clause = Yes` · one per selected `offer_red_flags` | score-based first, then field-signal | 5 | "No major watch-outs identified." |
  | Next steps | Salary<75 **or** `offer_negotiation_room ≠ Low` · Growth<75 · Work-life<75 · Culture<75 | category score ascending | 4 | fallback: "Request written confirmation of key terms" |

  *Where* it runs is settled by handoff §5, not open to interpretation:
  > every number, label, strength, watch-out, and next step on this screen is read
  > from the scoring engine response. If the frontend contains a threshold
  > comparison that produces a displayed value, that is a defect — the thresholds
  > above are documented so you can verify the backend's output looks right, not so
  > you can implement them client-side.

  **Resolution: implement `deriveGuidance()` server-side** in the Sprint 5 scoring
  lib, call it inside `computeAndPersistOfferScore()` over the already-computed
  category scores plus the offer's answer rows, persist onto `offer_scores`, and
  return from `POST /offers/{id}/score`. The frontend purely renders. Satisfies both
  the FRS and the "no frontend scoring" DoD line.

  All fields the triggers read (`offer_annual_bonus_type`, `offer_annual_bonus`,
  `offer_overtime_compensation`, `offer_restrictive_clause`, `offer_red_flags`,
  `offer_negotiation_room`) are **already loaded** by
  `computeAndPersistOfferScore()` — no extra queries needed.

- **[ ] B2 — Recharts is not installed.** The handoff names it as a decided
  dependency ("not a choice left open"). Needs `npm install recharts`. It must be
  the *only* charting library in the module — the project already has `chart.js` +
  `react-chartjs-2` for other portal areas; do not reuse those here, and do not
  add a third.

### 1.3 Spec conflicts, and how I've reconciled them

| # | Conflict | Resolution |
|---|---|---|
| **C1** | **SCR-008 field count.** FRS §2 says **12 fields**; the Prisma model, the `OgQuestions` seed, and the live `culture` route all carry **14** — the extra two being `offer_employer_treatment_signal` and `offer_leadership_style`. | **Build 14.** This isn't drift: the Sprint 3 schema comment documents it as a deliberate split — `offer_company_reputation` and `offer_leadership_stability` were each feeding *two* categories at once, so each was split into a Stability-facing question and a Culture-facing counterpart rather than letting one answer double-count. The seed scores all 14. Building 12 would leave two seeded, scored questions permanently unanswerable. **Flag at PR review** so the FRS gets corrected at source. |
| **C2** | **SCR-006 commute / WFH: dimmed or hidden?** FRS §5 says "Field dimmed with conditional pill"; FRS §9 says "Dimmed with conditional pill… **Hidden** when `offer_work_arrangement = Remote`"; handoff §3 says "both **hidden** when Remote". | **Hidden.** Two of three sources say hidden, and it matches the SCR-004 precedent already settled by the PO in Sprint 6 (§5 Key Product Decisions wins over §9 Screen Layout). |
| **C3** | Several FRS docs (SCR-004→010 §9) say "Dark theme" as a layout decision | Superseded — **light is default**, per handoff §8. Same as Sprint 6. |
| **C4** | SCR-007 `offer_growth_importance` / SCR-008 `offer_culture_importance` / SCR-006 `offer_worklife_importance` | These are **weight modifiers, not scored questions**. Frontend captures them and sends them; it must not treat them as contributing a score. `offer_worklife_importance` is Low/Medium/High (string); the other two are 1–5 (int) per the schema — **not symmetrical**, don't "tidy" them into matching shapes. |

---

## PART 2 — PLAN

### 2.1 Build order

```
P0  Foundations   → npm i recharts; HelpIcon; api.ts additions; screens.ts flags
P1  SCR-006       → 12 fields, 2 sections, 2 hidden-when-Remote
P2  SCR-007       → 12 fields, 2 sections, 4 rating scales
P3  SCR-008       → 14 fields (C1), HelpIcon on every label, red-flag chips, notes
P4  B1 decision   → backend guidance slice (blocks SCR-010 only)
P5  SCR-009       → offer cards, compare table, market intel empty states, consent reminder
P6  ScoreBreakdown→ Recharts, 7 bars, gradient, theme-token fills
P7  SCR-010       → score hero, chart, strengths/watch-outs/next steps, action strip
P8  Epic 7.4      → HelpIcon retrofit to SCR-001…007 (not launch-blocking)
P9  Verification  → full SCR-000→010 walkthrough, single + multi offer, light/dark
```

SCR-006/007/008 are unblocked and can ship regardless of how B1 lands. Only
SCR-010 depends on it, so B1 is sequenced late rather than up front.

### 2.2 New files

```
src/components/shared/
  HelpIcon.tsx              # shadcn Tooltip wrapper — indigo circle, hover + tap
  OfferCompareTable.tsx     # SCR-009 category comparison, Tie handling
  ScoreBreakdown.tsx        # SCR-010 Recharts, 7 bars + gradient

src/app/offerguide/_constants/
  scr006.ts  scr007.ts  scr008.ts  scr009.ts  scr010.ts

src/app/offerguide/wizard/
  work-life/page.tsx  growth/page.tsx  culture/page.tsx
  compare/page.tsx    results/page.tsx
```

### 2.3 Control mapping (from each FRS §9, cross-checked to the seed)

| Screen | Dropdowns | Radio Cards | Rating 1–5 | Other |
|---|---|---|---|---|
| **006** | weekend work, hybrid days, time flexibility, after hours, leave flexibility | travel, overtime comp, energy fit, worklife importance | — | 2 numeric w/ unit labels |
| **007** | training support, promotion timeline | learning budget, promotion path, mentorship, strong leaders, internal mobility, role scope | goal match, brand value, skill potential, growth importance | — |
| **008** | — | manager impression, inclusion, work pressure, reputation, leadership stability, treatment signal, leadership style, psych safety | team culture fit, values alignment, purpose sense, culture importance | red-flag chips, notes textarea |

### 2.4 Signal colours (amber = negative, green = positive)

- **SCR-006:** `Energizing` green · `Tiring` amber
- **SCR-008:** amber on `Concerning`, `Very high`, `Weak`, `Changing`, `Low`
  (psych safety **and** inclusion both use `Low` — scope the amber per-field, not
  globally by value string)
- **SCR-009:** winner badge green · Tie badge on ties
- All via the `warning` / `success` tokens wired in Sprint 6 — no hex.

---

## PART 3 — DEFINITION OF DONE

### A. Foundations (P0) — **COMPLETE**

- [x] `recharts` **3.10.1** installed; it is the **only** charting import in the OfferGuide module (`chart.js` / `react-chartjs-2` exist in the repo for other areas — not reused here)
- [x] `HelpIcon` in `components/shared/` — shadcn Tooltip wrapper, indigo circle + white "i", hover on desktop, **tap on mobile** (explicit `onClick` toggle, since iOS can deliver a tap without lasting focus), fixed 14px `leading-none` box so it can't alter a label's line height
- [x] Wired into the shared `Field` as an opt-in `helpIcon` prop that reuses the field's existing `helpText` — so tooltip copy and help copy can never drift apart, and the Epic 7.4 retrofit is a one-prop change per screen
- [x] `screens.ts` flips SCR-006…010 to `built: true` as each ships — 006/007/008 flipped
- [x] `api.ts` gains `updateOfferWorkLife`, `updateOfferGrowth`, `updateOfferCulture`, `computeOfferScore` + their types
- [ ] Zero hardcoded hex in the diff, **including Recharts fills and gradient stops** — verify at the end, once the chart exists

### A2. B1 — backend guidance slice — **COMPLETE**

- [x] `deriveGuidance()` implemented server-side in `scoring/deriveGuidance.ts`
- [x] Called from `computeAndPersistOfferScore()`, reading only data already loaded — no extra queries
- [x] Migration `20260815000000_add_offer_score_guidance` applied — `strengths` / `watch_outs` / `next_steps` JSON columns
  - MySQL rejects a literal `DEFAULT` on a JSON column, so the migration backfills existing rows explicitly rather than relying on a schema default
- [x] `POST /offers/{id}/score` now returns the three lists alongside the scores
- [x] **15 unit tests, all passing** — every §6.3–6.5 rule including the boundaries: exactly 75 qualifies as a strength, exactly 60 does *not* fire a watch-out, the bonus trigger needs type **and** amount, the salary next-step is an OR on negotiation room, the ≤5 cap keeps score-based watch-outs ahead of field-signal ones, and red flags parse from both array and JSON-string column shapes
- [x] Full suite green — **68 tests / 8 files**, no regression to the Sprint 5 engine

### B. SCR-006 Work & Life (P1) — **COMPLETE, verified in a real browser**

- [x] 12 fields; **0 required**; two sections with mini-stepper (Daily Reality 6 · Flexibility & Fit 6) — **verified**: 12 labels, sections render as "1 Daily reality" / "2 Flexibility & fit", step badge reads "Step 6 of 10 — Work & Life"
- [x] Two columns desktop, single column mobile, same field order
- [x] `offer_working_hours` numeric, inline unit `hrs / week`, range 1–168
- [x] `offer_commute_minutes` numeric, inline unit `min / day`, range 0–300
- [x] Both numeric fields submit **`null`, never `0`**, when blank — **verified twice**: direct API PATCH and through the UI's own Next click, both returning `offerWorkingHours: null` / `offerCommuteMinutes: null` in the persisted row
- [x] `offer_commute_minutes` **and** `offer_wfh_support` **hidden** when `offer_work_arrangement = Remote` (C2) — **verified live**: 12 fields with both present on On-site, **10 fields with both absent** after PATCHing the offer to Remote and reloading
- [ ] Energy fit: `Energizing` green, `Tiring` amber
- [ ] Dropdowns: weekend work, hybrid days, time flexibility, after hours, leave flexibility
- [ ] Radio cards: travel requirement, overtime compensation, energy fit, work-life importance
- [ ] Weekend work includes **`Alternate`**; after hours includes **`Always`**
- [ ] Defaults: most enums `Not clear`; `offer_hybrid_days` = `Not applicable`; `offer_personal_energy` = `Not sure`; `offer_worklife_importance` = `Medium`
- [ ] `offer_worklife_importance` captured only — never treated as a scored answer (C4)
- [ ] Saves to the SCR-006 field group under `/offers/*`

### C. SCR-007 Growth (P2) — **COMPLETE, verified in a real browser**

Audited against the FRS field inventory: the FRS also mentions
`offer_learning_budget_amount`, but that is an explicit **Backlog** item
("deferred to future phase"), correctly **not** built. The 12 shipped fields are
the complete MVP set.

- [x] 12 fields; all optional; 0 conditional; two sections (Learning & Development 4 · Career Progression 8) — **verified**: 12 labels, sections "1 Learning & development" / "2 Career progression", step badge "Step 7 of 10 — Growth"
- [ ] 5-point numeric Radio Cards with anchor labels for goal match, brand value, skill potential, growth importance — **no star metaphor anywhere**
- [ ] `offer_goal_match` spans **full width** on desktop
- [ ] `offer_role_scope` spans **full width** on desktop
- [ ] Dropdowns: training support, promotion timeline. Radio cards: learning budget, promotion path, mentorship, strong leaders, internal mobility
- [ ] `Not clear` present on every enumeration field, using that exact string
- [ ] `offer_education_reimbursement` still on SCR-005 — **not deduplicated**, not moved
- [ ] `offer_growth_importance` default **3**, weight modifier only (C4)
- [ ] Saves to the SCR-007 field group under `/offers/*`

### D. SCR-008 Culture & Manager (P3) — **COMPLETE, verified in a real browser**

- [x] **14** fields (C1 — flag the FRS's "12" at PR review); all optional; two sections (Manager & Team · Company Culture) — **verified**: 14 labels, step badge "Step 8 of 10 — Culture & Manager"
- [x] **`HelpIcon` inline with every field label** — **verified**: exactly **14 help icons for 14 fields**, one per label
- [ ] Amber on: `Concerning` (manager), `Very high` (pressure), `Weak` (reputation), `Changing` (leadership stability), `Low` (psych safety, inclusion) — scoped per field
- [x] `offer_red_flags` — multi-select **amber** chips, 6 values + `Other` (dashed border, free text max 100) — **verified**: all 7 chips render (Unclear role · Poor communication · Unrealistic expectations · Toxic manager vibe · Delay in process · Low transparency · + Other). Needed a new `tone="warning"` prop on `Chips` — every value here is a negative signal, so the default accent-blue selected state would have read as approval
- [x] Red-flag hint text confirms each selection reduces the culture score — **verified present**
- [x] `offer_notes` — full-width textarea, **explicitly labelled as not scored** — **verified**: renders a real `<textarea>` and the "Not scored" label is present. Excluded from community contribution in the payload comment and never sent to any consent-gated path
- [x] 5-point Radio Cards: team culture fit, values alignment, purpose sense, culture importance
- [x] Saves to the SCR-008 field group under `/offers/*`

### E. B1 — backend guidance slice (P4) — **DECISION REQUIRED**

- [ ] Strengths / watch-outs / next steps derived **server-side** from the already-computed scores + answer rows
- [ ] Persisted on `offer_scores` and returned by `POST /offers/{id}/score`
- [ ] Trigger rules exactly per handoff §5 (documented there for backend implementation, not client-side use)
- [ ] Frontend contains **no threshold comparison that produces a displayed value**

### F. SCR-009 Compare & Market Intelligence (P5) — **COMPLETE, verified in a real browser**

**Verified with a live 2-offer session:** 2 offer cards · compare table with all
7 category rows · winner badge · 6 market cards all in empty states · consent
rendered with **0 interactive switches** and a working link back to SCR-001 ·
Add-another-offer CTA present. Tie handling proven both ways — identical answers
produced **7 ties + both cards badged**, and deliberately-differentiated offers
produced **1 tie + 6 wins for Offer A + a single Top match badge**. Single-offer
view: **1 card, compare table absent, no winner badge**. Mobile 375px: no
horizontal overflow.

**Honesty checks passed** — regex scan of the rendered page found **no invented
percentages and no fake salary range** (`P25`/`P75`/`Median Rs` absent).

- [ ] Always shown, single and multiple offers alike; content adapts by offer count
- [ ] **Single-offer view:** one offer card, overall fit score, category tags, Add-another CTA, market panel — **comparison table hidden**
- [ ] **Multiple-offer view:** cards side by side, winner badge, Add-another CTA, **plus** the comparison table
- [ ] Winner badge **green**, on the highest overall score, desktop **and** mobile
- [ ] **Ties show both badges**, and the table's Winner column shows a **Tie** badge rather than picking one
- [ ] Offer cards show: label, company (title), role (subtitle), work arrangement tag, base salary w/ currency + pay period, total est. compensation annualised below base
- [ ] Add-another-offer CTA: dashed border, always visible **including** in multi-offer view; creates a slot → routes to SCR-003; **no cap**
- [ ] Six market cards built in full — 3-col desktop / 2-col mobile, community note below, privacy note at bottom
- [ ] Every card ships an **honest empty state** — **no placeholder numbers, no sample ranges, no invented percentages**
- [ ] No card renders broken/blank/error-like — the empty state is a designed state
- [ ] Empty state is a **data-absent branch**, so real data later populates the same components with no structural rewrite
- [x] ~~Consent section is **read-only** — master + 5 sub-toggles displayed, no interactive control, link back to SCR-001~~ → **superseded by the PO on 2026-08-18: consent toggles are INTERACTIVE here.** Conflict C5 resolved in favour of the SCR-009 FRS (§2 "Mixed — read-only display + interactive (community consent toggles)", §2 "Total New Fields: 6 — all community consent toggles", §7 Product Dictionary entries for all six, §10 chip spec) over the Sprint 7 handoff Story 7.2.4 wording. Built as `_components/ConsentChips.tsx`
- [x] **Two consent editors, one stored value** — SCR-001's `ConsentCard` is live again (it was briefly commented out), so consent is editable on both SCR-001 and SCR-009. Safe because both write `PATCH /candidate-profile/consent` and the value lives on the candidate profile, not the session: one stored copy, no fork. Divergence — not duplication — is what the handoff's "no second editable copy" guarded against. **Verified:** set on SCR-009 → submitted SCR-001 → value unchanged (`shareAnonymous:true`, 2 selections intact) → SCR-009 re-render still shows them on. **Any future consent surface must use this same endpoint rather than hold its own state**
- [x] Consent verified live (Puppeteer, light theme): 6 switches (1 master + 5 subs, matching the `OgConsentToggles` seed) · defaults all off · sub-toggles `disabled` + dimmed while master off, and clicking one is a genuine no-op · master on enables all five · selections persist across a full page reload · master off re-dims without clearing stored sub-values, so master back on restores the earlier choices · 0 page errors · mobile 375px wraps to 3 rows with no horizontal overflow
- [ ] `HelpIcon` on both section headers, each market card header, and the consent label
- [ ] Back / Next only, no Skip

### G. SCR-010 Results (P6–P7) — **COMPLETE, verified in a real browser**

**Verified live:** Recharts renders **7 bars** with the `#og-score-gradient`
`<linearGradient>` present in the DOM · **"Finish"** replaces Next · all four
sections render · both disclaimer lines verbatim · all three action buttons ·
**Download produced a real 1,165-byte `text/plain` Blob**. Community insight
correctly **hidden for the multi-offer session and shown for the single-offer
session**. Mobile 375px: no horizontal overflow.

**Guidance is genuinely backend-driven** — a strong offer returned
`overall 83 / "Good Fit" / 4 strengths / 0 watch-outs / 1 next step`, a weak one
returned `overall 50 / "Weak Fit" / 1 strength / 5 watch-outs / 4 next steps`.
The caps (≤4, ≤5, ≤4) held, and the empty-state branches are reachable — the
strong offer legitimately produced zero watch-outs.

Note: the engine's live `recommendationLabel` values ("Good Fit", "Weak Fit",
"Proceed with Caution") differ in wording from the FRS's illustrative strings
("Good fit — negotiate a few points"). The screen renders whatever the engine
returns rather than re-deriving from thresholds, which is the required
behaviour — but the **label wording is a backend/FRS copy mismatch worth
raising** at PR review.

- [ ] **Zero input fields**; fully read-only
- [ ] Score hero: large overall score left, recommendation card right (green border + green label), bar fills proportional
- [ ] Static hint: *"Based on alignment with what matters most to you."*
- [ ] Offer reference shows offer label + company name
- [ ] Recommendation label **rendered from the backend's label**, never recomputed
- [ ] `ScoreBreakdown`: 7 vertical bars (Salary · Benefits · Stability · Work-Life · Growth · Culture · Purpose), height ∝ score, value above, label below
- [ ] Teal→blue fill via SVG `linearGradient`, colours from **theme tokens**; chart re-renders correctly on theme change
- [ ] Static note: *"Scores are based on your answers and your selected priorities from the evaluation setup."*
- [ ] Strengths: ≥75, descending, **max 4**, green checks. Empty: *"No categories scored above 75."*
- [ ] Watch-outs: **max 5**, score-based first then field-signal, amber panel + icons. Empty: *"No major watch-outs identified."*
- [ ] Next steps: **max 4**, ascending by category score, full-width button rows w/ right arrow; fallback *"Request written confirmation of key terms"*
- [ ] Community insight: **single offer only**, hidden for multiple; static, no invented statistics
- [ ] Action strip: Download summary (primary) · Add another offer · Revisit answers; wraps on mobile
- [x] ~~Download summary → **plain text** file, real browser download (not PDF in MVP)~~ → **superseded by the PO on 2026-08-28: the download is now a real PDF report.** Built in `lib/offerguide/buildSummaryPdf.ts` with jsPDF (already a dependency — no new package). Title block, offer details, fit-score panel, proportional category bars, strengths / watch-outs / next steps, disclaimer, and a `Generated <date> · Page n of m` footer. jsPDF is imported dynamically so it stays out of the initial bundle; `buildSummaryText` is retained as the fallback when that chunk fails to load, and the button disables while building so a second click cannot produce a second file
- [ ] **PDF cannot render Urdu / Sindhi / Balochi / Shahmukhi Punjabi.** jsPDF's built-in fonts are Latin-only, so a translated report needs an embedded Nastaliq or Arabic font (~2–10MB each) plus RTL text shaping. Tracked separately from translating the screens — see [[offerguide-i18n-scope-decision]]
- [ ] Add another offer → new slot → SCR-003. Revisit answers → SCR-001
- [ ] Footer disclaimer verbatim: *"This is decision guidance, not a final decision."* / *"You choose what fits your life and career. OfferGuide helps you think clearly — the decision is always yours."*
- [ ] **"Next →" replaced by "Finish"** on both top and bottom nav
- [ ] Module stepper: all steps done except step 10 active (desktop only)
- [ ] `HelpIcon` on every section header

### H. Epic 7.4 — HelpIcon retrofit (P8, not launch-blocking) — **DONE**

- [x] `HelpIcon` inline with every field label on SCR-001 → SCR-007. Done centrally in `Field.tsx` rather than screen by screen: `helpText` now renders **only** as the ⓘ tooltip, so every screen using the shared wrapper was retrofitted at once. SCR-002 does not use `Field`, so its three fields were converted individually
- [x] Content pulled from each field's FRS **Help Text** — no newly invented copy. Guaranteed structurally: the tooltip reads the same `helpText` prop the paragraph used to, so the two cannot drift
- [x] **The always-visible help paragraph is removed product-wide**, per the PO on 2026-08-28 ("Make help icon that display help text / So Help text will be remove"). The `helpIcon` opt-in flag is gone — showing the icon is now the default, not a per-screen switch
- [x] No layout shift or label line-height change — HelpIcon is a fixed 14px `inline-flex` box on the label's existing baseline
- [x] **Verified:** SCR-001 renders 23 help icons and zero leftover help paragraphs; clicking "Help: Career stage" opens the FRS text verbatim. SCR-002 renders 3 icons, SCR-008 renders its full set
- [ ] ~~Kept as an isolated commit~~ — not isolated in the end: it landed alongside the geography, currency, PDF and i18n work in the same session

### H2. Translations / i18n (added by the PO on 2026-08-28)

- [x] Language switcher, RTL layout and per-language font — `_i18n/LocaleProvider.tsx` sets `dir` and the Nastaliq face at module level, so RTL flips the whole wizard without per-component work. Scoped to OfferGuide deliberately: `dir="rtl"` in the root layout would flip every existing portal page
- [x] **Adding a language is a data change, not a code change** — register it in `_i18n/locales.ts`, add a dictionary file, done. This is what makes Sindhi / Punjabi / Balochi a native-speaker task rather than an engineering one
- [x] **Translations are display-only.** `validateEnumField` checks dropdown answers against the seeded English byte-for-byte, so a translated value reaching the API returns 400. `t()` is on the render path only; `onChange` and every request body carry the English original. **Verified: clicked `سینئر`, server stored `careerStage: "Senior"`**
- [x] Covered: section titles, sub-sections, field labels, ⓘ help text, all dropdown option values (`RadioCards`, `BinaryRadioCards`, `Select`), conditional pills, buttons, placeholders, intro copy
- [x] Country and currency names need **no dictionary** — `Intl.DisplayNames` resolves them from ISO codes in any locale (~350 strings permanently off the translation workload). Verified: `پاکستان`, `پاکستانی روپیہ`
- [x] `dir="auto"` on text-bearing elements so an **untranslated English fallback keeps its punctuation** inside the RTL wrapper — without it, "…every offer you evaluate." rendered as "…every offer you .evaluate"
- [ ] **Urdu is a working first pass by Claude, not reviewed translation.** Needs a native speaker before launch; flagged in the `ur.ts` header. Longer help paragraphs still fall through to English — a visible gap, not a broken screen
- [ ] Sindhi, Punjabi (Shahmukhi), Balochi — dictionary files not yet written
- [ ] Results text (strengths / watch-outs / next steps) is generated **server-side** in `deriveGuidance.ts`, so translating it means translating backend output — not covered by the client dictionary

### I. Cross-cutting (P9)

### H3. Reference data — countries, cities, currencies (PO, 2026-08-28)

- [x] **Countries: 2 → 197.** All three country dropdowns (SCR-001 current, SCR-001 preferred, SCR-003 offer) read the same `/config/geography` endpoint, so no page changes were needed
- [x] **Cities: 5 → 1,567**, major cities per country. Source data in `lib/offerguide/geoData.js`
- [x] **Currencies: 38 → 155** — the complete active ISO 4217 set
- [x] **City keeps a free-text escape hatch** (`Combobox allowCustom`), per the PO's choice and the existing model note that `current_city` / `offer_city` are free-text columns the dropdown only *suggests* into. Country and currency deliberately do **not** allow custom values — closed ISO sets, and an invented value would break scoring and market matching
- [x] A real match always wins over the typed string, so free text cannot shadow a listed city
- [x] **Seeding is non-destructive.** Both `scripts/seed-geography.mjs` and the OgGeography block in `seed-offerguide.js` merge rather than delete-and-insert, because admins edit geography at runtime through the admin config routes — a rebuild would discard their edits and resurrect cities they deactivated. Verified: the 2 pre-existing countries were updated, not duplicated (1,562 of 1,567 cities added)
- [x] **Verified end to end:** Pakistan → 51 cities; typing "Kar" offers Karachi/Okara/Shikarpur/Skardu *plus* the custom row; an unlisted city saved as `{"currentCountry":"PK","currentCity":"Chak Jhumra"}`

### I. Cross-cutting (P9)

- [ ] Full wizard **SCR-000 → SCR-010** completes as a **guest**, single offer **and** multiple offers
- [ ] Same as a **registered** user
- [ ] Multi-offer: SCR-003→008 repeat per offer; SCR-001/002 do **not**; labels re-sequence if an offer is removed
- [ ] Scores fetched **per offer** after that offer's field groups are saved — never computed client-side
- [ ] Draft autosave on blur + step change, unchanged from Sprint 6
- [ ] All five screens verified in **light, dark and system**
- [ ] All five verified at desktop **and** mobile; no horizontal overflow at 375px
- [ ] No role check, no admin surface, no offer-count cap
- [ ] Naming per `NAMING_CONVENTIONS.md`; shared components in `components/shared/`, module code in `_components/` / `_state/` / `_constants/`

---

## PART 4 — DECISIONS

**No open product decisions.** Both FRS documents specify every rule needed; the
Sprint 7 handoff settles every placement question. Everything below is settled and
proceeding.

- **B1 — settled by spec, not by choice.** SCR-010 §6.3–6.5 give the complete
  derivation rules and handoff §5 puts them server-side. Implementing
  `deriveGuidance()` in the scoring lib + a migration for three `offer_scores`
  columns. No frontend threshold logic.
- **C1 — SCR-008 builds 14 fields**, not the FRS's stated 12. The extra two are a
  deliberate Sprint 3 split (documented in the schema), are seeded, and are scored.
  Flag for FRS correction at PR review.
- **C2 — commute / WFH hidden when Remote**, matching handoff §3, FRS §9 and the
  SCR-004 precedent already ruled on in Sprint 6.
- **B2 — Recharts added** as the module's only charting dependency.

### 4.2 Conflicts resolved during the SCR-009 build

Both are cases where the **SCR-009 FRS** and the **Sprint 7 handoff** disagree.
I initially resolved both in the handoff's favour as the newer document. **The
PO overruled both**, in each case siding with the FRS and the approved mockup.
Both are now built the FRS way. The rulings below are recorded as decided, with
the superseded reasoning kept so the reversal is traceable.

| # | Conflict | Resolution |
|---|---|---|
| **C5** | **Consent editable or read-only?** SCR-009 FRS §2 calls the toggles "interactive", §7 defines all six as *new fields on this screen*, and §10 specifies the chip layout. Handoff Story 7.2.4: "read-only… with no interactive control… **No second editable copy of consent anywhere in the product**." | **INTERACTIVE — PO ruling, 2026-08-18** ("In scr-009 you have not make functional Consent toggles do it"). ~~Originally built read-only per the handoff.~~ Now `_components/ConsentChips.tsx`: full-width green master chip, five dimmed sub-chips, per FRS §10. Safe alongside SCR-001's `ConsentCard` because both write `PATCH /candidate-profile/consent` — one stored value on the candidate profile, so the two cannot diverge. Verified end to end. |
| **C6** | **Market intelligence: placeholder numbers or empty states?** SCR-009 FRS §6.3 marks every metric "Placeholder" and §5 says "Placeholder data shown in MVP". Handoff Story 7.2.3: "**Every card ships in an empty state**… No placeholder numbers, no sample ranges, no invented percentages." | **POPULATED — PO ruling, 2026-08-18** ("Market Intelligence isnot showing according to pdf"). ~~Originally built as empty states.~~ Now shows the FRS/mockup figures behind a visible **"Sample data"** badge, so nothing reads as a real community statistic. Each card keeps its own data-absent branch, so real benchmarks later populate the same components with no rewrite. |

**Pattern worth noting for future conflicts:** where the FRS and the handoff
disagree, the handoff being newer did *not* make it right. The PO has sided with
the FRS both times. Raise the conflict rather than silently applying the
"newer document wins" rule.

### 4.1 Noted drift (no action needed this sprint)

SCR-010 §7's priority→category table lists **Security → Stability**, but SCR-002's
own FRS priority list has no `Security` value (it has `Commute`). The same stale
`Security` appears in a `schema.prisma` comment. This is backend weight-mapping
logic already implemented in Sprint 5 and does not affect any Sprint 7 screen —
recorded here so it isn't rediscovered as a bug later.
