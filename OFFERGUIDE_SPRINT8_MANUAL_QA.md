# OfferGuide — Sprint 8 Manual QA Sheet

Everything mechanically checkable is automated in `npm test` (297 tests). This
sheet is what is left: the criteria that genuinely need a browser, a live
database, and a person looking at the screen.

**Before starting**

```bash
npm test
```

If that is not green, stop — the manual pass is not meaningful until it is.

```bash
npm run dev
```

Set `OFFERGUIDE_ADMIN_TOKEN` in `.env` before exercising Part C.

---

## Part A — Swagger and the guest-cookie gap

`/docs` renders `public/openapi.yaml`. Swagger's **Authorize** button can drive
the JWT and admin-token cases only — it **cannot** attach the `guestToken`
httpOnly cookie. Every `guestOrAuth` operation therefore needs a second pass
outside Swagger.

- [ ] `/docs` loads with no parse error and no red banner
- [ ] All four auth-mode badges render (PUBLIC / bearer / cookie / admin token)
- [ ] `/api-docs` still loads (the pre-Sprint-8 link is not broken)

### The guest round trip

Automated tests confirm each route *declares* `guestOrAuth`. Only a live request
proves the cookie path actually works.

```bash
curl -i -c jar.txt -X POST http://localhost:3000/api/offerguide/candidate-profile \
  -H 'Content-Type: application/json' \
  -d '{"careerStage":"Mid-Level","preferredWorkArrangement":"Hybrid"}'
```

- [ ] Response sets a `guestToken` cookie, and it is marked `HttpOnly`
- [ ] `curl -b jar.txt http://localhost:3000/api/offerguide/candidate-profile` returns that same profile
- [ ] The same call with **no** cookie and **no** token returns 404, not the profile
- [ ] Repeat for a JWT instead of the cookie — same shape, scoped to that user
- [ ] With a second guest's cookie, the first guest's session/offer ids return **404** — no cross-candidate leakage

### Public reads

- [ ] `GET /api/offerguide/config/questions?screen=SCR-005` returns data with **no** `score`, `scoreType`, `numericBands`, `nullScore` or `ratingMultiplier` anywhere in the payload *(read the raw JSON, not the rendered table)*
- [ ] All four `/config/*` routes succeed with no cookie and no token

---

## Part B — Wizard walkthrough (Story 8.2.1)

Run the whole flow **twice**: once as a guest in a clean private window, once
signed in. Both must complete and produce a scored result.

### Guest run

- [ ] SCR-000 → SCR-010 completes end to end with only the guest cookie
- [ ] No screen at any point demands an account

### Authenticated run

- [ ] Completes end to end and behaves identically
- [ ] Session appears in saved history afterwards
- [ ] Registering mid-flow (same browser) links the guest profile — answers survive

### Per-screen field parity

Check each screen against its FRS: field count, required vs optional, allowed
values, conditional visibility, and the "Not clear / Not sure / Not applicable"
terminology standard.

- [ ] **SCR-001** — 24 fields; only `career_stage` and `preferred_work_arrangement` required; **no** Skip button; consent card at the bottom
- [ ] **SCR-002** — 3 required; `evaluation_priorities` enforces min 1 / max 3 with a live counter
- [ ] **SCR-003** — offer detail fields per FRS
- [ ] **SCR-004** — the fixed `CompensationBar` stays anchored below the top nav **at every breakpoint**
- [ ] **SCR-005** — 13 fields (11 Benefits, 2 Security)
- [ ] **SCR-006** — 12 fields
- [ ] **SCR-007** — 12 fields
- [ ] **SCR-008** — 12 fields
- [ ] **SCR-009** — always displays; content adapts by offer count; consent section is **read-only**
- [ ] **SCR-010** — zero input fields; "Next →" is replaced by **"Finish"** on both top and bottom nav

### Conditional visibility

The standard is **dim with a `conditional` pill, not hide** — except four
documented full-hide cases.

- [ ] Conditional fields dim rather than disappear
- [ ] Full-hide confirmed for: commute when Remote · WFH support when Remote · transport allowance when Remote · review cycle when Contract
- [ ] `offer_visa_support` behaves correctly across all three branches
- [ ] `offer_visa_support` stays **active** when `current_country` was left blank on SCR-001

### Multi-offer paths

- [ ] Adding a second offer from SCR-009 loops back through SCR-003 → SCR-008 for the **new** offer
- [ ] Returning to SCR-009 shows **both** offers
- [ ] The winner badge appears on the higher-scoring offer *(the winner comes from `GET /evaluation-sessions/{id}/compare`; if you see a badge with no such request in the network tab, that is a defect)*
- [ ] A genuine tie badges **both** offers
- [ ] Deleting one offer leaves the session and the remaining offers intact

### SCR-010 rendering

- [ ] 7-category Recharts bar chart renders with score labels above and category labels below
- [ ] Recommendation label matches the score band — 85+ "Excellent fit", 72–84 "Good fit", 58–71 "Moderate fit", below 58 "Weak fit"
- [ ] Strengths (≤4), watch-outs (≤5), next steps (≤4)
- [ ] Correct empty state wherever a list is empty ("No categories scored above 75." / "No major watch-outs identified.")
- [ ] Community insight card appears **only** when `evaluation_offer_count` = One offer
- [ ] Download summary produces a plain-text file containing scores, strengths, watch-outs and next steps
- [ ] Footer disclaimer present

---

## Part C — Admin gate, live (Story 8.2.3)

The automated suite proves `requireAdmin()` rejects all three non-admin cases
and that every admin route is gated. This part confirms it end to end against a
running server. Spot-check at least one operation per collection.

For each of the 26 `/admin/config/*` operations:

- [ ] No credentials → 401
- [ ] Valid **guest cookie** → 401
- [ ] Valid **ordinary registered-user JWT** → 401
- [ ] Correct `x-og-admin-token` → succeeds

### Integrity rules, live

- [ ] `PUT` / `PATCH` on `/admin/config/scoring` → 404/405. The route does not exist; it is not a route that rejects you
- [ ] `POST /admin/config/scoring` with an existing version number → 400
- [ ] Creating a new scoring version leaves previously computed scores **unchanged** *(re-read a score row's values before and after)*
- [ ] `DELETE /admin/config/consent-toggles/consent_share_anonymous` → **409**
- [ ] `DELETE` any other toggle → 200, body shows `active: false`, and it is **still listed** by `GET /admin/config/consent-toggles`
- [ ] That retired toggle **disappears** from `GET /config/consent-toggles` and from the SCR-001 consent card, with no deploy
- [ ] Same soft-delete check on questions, geography, market-benchmarks, functional-domains

---

## Part D — Consent (Story 8.3.1)

- [ ] Consent is captured on **SCR-001**, in a card at the bottom
- [ ] It is stored on `candidate_profiles.consentSettings` — **candidate level**, not per session
- [ ] One master toggle plus five sub-toggles
- [ ] Every toggle defaults to **Off**
- [ ] Master Off ⇒ every sub-toggle treated as Off regardless of stored value, and dimmed in the UI
- [ ] Toggle definitions come from `GET /config/consent-toggles`, not hardcoded
- [ ] Copy is anonymised throughout — nothing implies personal data is shared
- [ ] **SCR-009 is read-only**: current state plus a link back to SCR-001, no editable toggle
- [ ] Changing consent on a return visit updates the existing profile rather than creating a second one
- [ ] `offer_notes` is excluded from culture signal contribution even with that toggle On

---

## Part E — Scoring, live

The engine is covered by the golden fixtures. This confirms the wiring between
the wizard, the API and the stored row.

- [ ] Completing a wizard run writes an `offer_scores` row
- [ ] That row carries a `scoringConfigVersion`
- [ ] Re-running compute-score under an unchanged config reproduces identical values
- [ ] Adding a question with `category: Growth` through the admin API changes the Growth average on the next run — **with no code change**
- [ ] `GET /offers/{offerId}/score` returns the stored row without recomputing
- [ ] `GET /offers/{offerId}/score` on a never-scored offer returns 404

---

## Sign-off

- [ ] Every box above is ticked, or the exception is recorded as a named backlog item
- [ ] All Sprint 8 defects (D1–D8) closed
- [ ] `npm test` green
- [ ] `npm run build` succeeds

| | |
|---|---|
| Verified by | |
| Date | |
| Build / commit | |
| Exceptions accepted | |
