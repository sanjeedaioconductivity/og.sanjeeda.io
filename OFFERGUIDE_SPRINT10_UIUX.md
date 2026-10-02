# OfferGuide — Sprint 10 UI/UX: Admin Configuration UI

**Status:** Draft. Companion to `OFFERGUIDE_SPRINT10_PLAN_AND_CHECKLIST.md` and `OFFERGUIDE_SPRINT10_FRS.md`.

## Design system &amp; reuse strategy

**Reuse, don't reinvent.** This sprint adds zero new visual language — it's built entirely from the theme/component system Sprint 2 already shipped (`ThemeProvider`, light-default per Sprint 6's ruling, dark/system via the existing toggle) and the shadcn primitives already installed: `button, input, label, card, dialog, select, tabs, tooltip, progress, badge, separator`.

**Two small gaps to close first, not new design decisions:**
- `switch` and `slider` shadcn components are still not installed (same gap flagged back when this sprint was first scoped, unresolved by the merge). ADM-002's importance-weighting inputs (3-point/5-point scales) and any boolean flag in these forms (`active`, `isMaster` display) want these primitives rather than a hand-rolled checkbox/range input. Add both via `npx shadcn add switch slider` as a Story 10.1.1 prerequisite, not a design choice — they're standard shadcn, zero visual-language risk.
- **Chart library: Recharts, not Chart.js.** The project has both installed. OfferGuide's own wizard (`ScoreBreakdown.tsx`) already uses Recharts with theme-token-driven colors; the separate PGP management portal uses Chart.js/`react-chartjs-2`. ADM-002's fixture-diff comparison chart should follow OfferGuide's own precedent, not borrow the other portal's, to keep the module visually and technically consistent with itself.

**Color conventions** (extending, not inventing — matches `OfferCompareTable`'s green winner badge and SCR-005's amber-for-risk precedent):
- Active / Draft / Retired: `badge` variants — green (active), slate/outline (draft — scoring only), muted gray with a "Retired" label (soft-deleted, never a red "deleted" connotation since nothing is destroyed).
- Fixture-diff deltas: green for a score increase, red for a decrease, gray "—" for no change. Applied per-category and to the overall score, never implying a decrease is universally "bad" in the UI copy — just showing direction and magnitude.
- Warnings (low sample size, master-toggle block): amber inline banner/message, not a red error — nothing here is a failure state, just information the admin should have.

## Admin shell layout (ADM-000)

A **left icon+label sidebar**, not a card-grid-only landing — 6 fixed destinations plus `/api-docs` suit a sidebar better than a dashboard-style grid once an admin is actually working (the landing page's cards from the FRS become the sidebar's default/home view, not a separate navigation paradigm). This deliberately echoes the `management` portal's sidebar shell pattern (familiar to anyone who's used that dashboard) without sharing any code across the two — they sit on different auth systems and shouldn't be coupled.

- Sidebar items: Overview (ADM-000 default), Questions, Scoring, Market Benchmarks, Geography, Functional Domains, Consent Toggles, then a separator, then API Docs (external link icon, opens `/api-docs`).
- Top bar: page title, theme toggle (reuse existing), no separate "admin" branding beyond a small badge next to the portal logo — this is the same portal, just a permission tier, not a different product skin.
- Non-admin/guest hitting any `/offerguide/admin/*` URL directly: redirect to `/offerguide` before the shell renders at all (server-side check preferred over a client-side flash-then-redirect, if the routing setup allows it cheaply — otherwise a client check with a loading skeleton, never a flash of admin content).

## Shared list-screen pattern (ADM-001, 003, 004, 005, 006)

Five of the six resource screens are fundamentally the same shape — this is the pattern `AdminCollectionTable`/`AdminCollectionForm` (Story 10.5.1) generalizes, but Questions and Market Benchmarks need their own field-specific form bodies even though the surrounding list/filter/retire chrome is shared:

1. **Header row:** resource name, "+ Add" button (top right), Active/Retired filter (segmented control or simple tabs — reuse the existing `tabs` primitive), search/filter input where the FRS calls for it (Questions: by screen/category; Market Benchmarks: by role/location).
2. **Table:** sortable where the FRS specifies (`sortOrder` for Questions/Functional Domains/Consent Toggles), retired rows visually muted (not hidden — the filter controls visibility, muting is just a visual cue when "All" is selected).
3. **Row action:** click opens the edit form — a side panel (`Sheet`-style slide-over) rather than full page navigation or a modal `dialog`, since these are frequently-repeated small edits and a slide-over keeps the list visible/scrollable behind it. (Note: `sheet` isn't in the installed component list either — same category as `switch`/`slider`, add via `npx shadcn add sheet` as part of the same prerequisite story.)
4. **Retire action:** icon button in the row, opens a small inline confirm (popover, not a full modal — this is a low-stakes, reversible action per the FRS) before calling `DELETE`.
5. **Empty state:** honest and specific, matching SCR-009's precedent — "No questions yet — add the first one" with the Add button re-shown inline, never a bare blank table.

**Screen-specific form bodies:**
- **Questions (ADM-001):** the form's body switches entirely based on `scoreType` — an `enum` question shows an editable options table (drag-to-reorder via `sortOrder`, inline score input per option); `rating` shows a single multiplier input with a live "a rating of 4 scores {n}" preview line; `numeric` shows an ordered band list (`upTo`/`score` pairs) with a client-side check that bands strictly ascend, plus a `nullScore` field. `scoreType` itself is a dropdown **only enabled when creating** a new question — on an existing question it renders as plain read-only text, per the FRS's resolved decision.
- **Market Benchmarks (ADM-003):** flat form (role, location, currency, p25/p50/p75, sampleSize, effectiveFrom). The three percentile inputs sit in one row so their ordering relationship is visually obvious; a validation message appears inline the moment `p25 > p50` or `p50 > p75` is typed, not just on submit. If `sampleSize < 3`, an amber inline note appears under that field per the FRS's resolved decision — informational, doesn't block Save.
- **Geography (ADM-004):** the one screen where the "row" in the outer list is a country, and expanding it (accordion, not a nested table) reveals its cities as a simple inline add/remove list — no separate city screen exists, matching the embedded-array data shape.
- **Consent Toggles (ADM-006):** identical to the generic pattern, except the master toggle's retire icon button is present but clicking it always surfaces the 409 as an inline message ("This is the master consent toggle and can't be retired") rather than being disabled/hidden — consistent with the FRS's "show, then explain" decision.

## ADM-002 — Scoring Configuration (the one bespoke screen)

This screen doesn't fit the shared list pattern — it's a 3-step flow (history → draft → preview → activate), not a flat CRUD table.

1. **Version history:** a simple table (version, effective date, Active/Draft badge, "View"). No edit affordance anywhere in this table — clicking a row only ever navigates to a read-only detail view, reinforcing immutability visually as well as functionally.
2. **New Version editor:** opened via a clearly-separate "+ New Version" action (not a row edit), pre-filled from the currently active version. Grouped into the same sections the schema has — Category Weights (7 number inputs), Priority Boost + Priority→Category Map (a small fixed table, 8 rows), Importance Weighting (3 groups, using the newly-added `slider`/`switch` primitives where the scale is small and discrete), Evaluation Type Bonus (4 collapsible groups, one per evaluation type, since most admins will touch these rarely).
3. **Fixture-diff preview:** a table, 5 rows (fixtures A–E) × columns (7 categories + overall), each cell showing active→draft with a colored delta chip. A Recharts grouped bar chart above the table gives an at-a-glance view (active vs. draft, per fixture, overall score only) before the admin drills into the detailed table. This view is reached from a "Preview" button on a draft version's detail page — never auto-shown while editing, so it reads as a deliberate checkpoint.
4. **Activate:** a single button on the draft's detail/preview view, standard `dialog`-based confirm ("Activate version {n}? This will apply to all new evaluation sessions immediately.") per the FRS's resolved decision — no typed confirmation.

## Responsive &amp; accessibility notes

- **Desktop-first, not mobile-optimized.** This is an internal operator tool, same posture as the PGP `management` dashboards — usable down to tablet width (sidebar collapses to icons-only), but no dedicated mobile layout effort this sprint. If that assumption is wrong (e.g. admins genuinely need to retire a question from a phone), flag it and this gets a story.
- Every shadcn primitive here is Radix-based and keyboard/screen-reader accessible by default; the two custom pieces that need explicit attention are the numeric-band editor (ensure each band row's inputs are properly labelled, not just visually adjacent) and the fixture-diff table (use a real `&lt;table&gt;` with header scope attributes, not a div grid, so screen readers announce which fixture/category a delta belongs to).

## Explicitly deferred

- Drag-and-drop reordering beyond simple up/down controls for `sortOrder` fields (nice-to-have, not required for the DoD).
- Any bulk/multi-select row actions (bulk retire, bulk export) — ties to the already-deferred bulk import/export backlog item.
- A dedicated mobile layout.
