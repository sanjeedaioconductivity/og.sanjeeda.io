# OfferGuide — Sprint 4 Definition of Done Checklist

Sprint 4 = candidate-facing backend API routes. Built against `openapi_v2.0.yaml`
(shape contract) and `OG_Project_Charter_v1_0.md.pdf` (scope + DoD).

Legend: `[x]` done & verified · `[~]` done, note attached · `[ ]` not done (out of scope)

---

## A. New shared infrastructure (had to be built first — none existed)

- [x] Prisma client singleton — `src/lib/db/prisma.ts`
  - Note: Prisma 7 requires an explicit driver adapter, so `@prisma/adapter-mariadb`
    was installed and wired in (not a plain `new PrismaClient()`).
- [x] Identity resolver (bearer JWT → guest cookie) — `src/lib/offerguide/identity.ts`
  - Bearer path verifies the same `JWT_SECRET` + `{ id }` claim the portal's
    `src/app/api/auth/route.ts` issues; `id` = `userInfoId`.
- [x] Guest-token minting + httpOnly cookie helper — `src/lib/offerguide/identity.ts`
- [x] Profile / ownership lookup helpers — `src/lib/offerguide/profile.ts`, `offerAuth.ts`
- [x] Live enum + consent validation against Mongo — `src/lib/offerguide/questions.ts`, `validateBody.ts`
- [x] Error-shape + Decimal-serialization helpers — `src/lib/offerguide/errors.ts`, `serialize.ts`, `pick.ts`

## B. Epic 4.1 — Candidate Profile & Session

- [x] `GET /candidate-profile` — resolves JWT else guest cookie; **404 for fresh guest**, mints guest cookie
- [x] `POST /candidate-profile` — requires `careerStage` + `preferredWorkArrangement` only
- [x] `PATCH /candidate-profile` — return-visit updates
- [x] `PATCH /candidate-profile/consent` — updates `consentSettings.selections`
- [x] Consent keys validated against **currently-active** `OgConsentToggles`; invalid key → 400
- [x] `POST /claim-guest-profile` (bearerAuth) — links guest profile to `userInfoId`
- [x] `claim-guest-profile` no-ops cleanly (200) when no matching guest profile
- [x] `GET /evaluation-sessions` — caller's sessions, most recent first
- [x] `POST /evaluation-sessions` — **stamps currently-active `OgScoringConfig` version** (verified: got version 2)
- [x] `GET /evaluation-sessions/{sessionId}` — 404 if not found **or** not owned (indistinguishable)
- [x] `PATCH /evaluation-sessions/{sessionId}` — session-level field updates

## C. Epic 4.2 — Offers & Wizard Draft

- [x] `POST /evaluation-sessions/{sessionId}/offers` — requires `offerWorkArrangement` + `offerEmploymentType`
- [x] `GET /offers/{offerId}` — full detail, all 5 sub-sections joined
- [x] `PATCH /offers/{offerId}` — SCR-003 field updates
- [x] `DELETE /offers/{offerId}` — removes offer from a multi-offer session
  - Fix applied: deletes the 5 sub-resource + score child rows in a transaction first
    (no cascading FK existed — this was a 500 bug caught in verification).
- [x] `PATCH /offers/{offerId}/compensation` (SCR-004, 20 fields, upsert)
- [x] `PATCH /offers/{offerId}/benefits-security` (SCR-005, 13 fields, upsert)
- [x] `PATCH /offers/{offerId}/worklife` (SCR-006, 12 fields, upsert)
- [x] `PATCH /offers/{offerId}/growth` (SCR-007, 12 fields, upsert)
- [x] `PATCH /offers/{offerId}/culture` (SCR-008, 14 fields, upsert)
- [x] All 11 SCR-003 fields present incl. `offerFunctionalDomain`, `offerReceivedDate`, `offerProbation`
  - Fix applied: `offerFunctionalDomain` + `offerReceivedDate` were **missing from the
    Prisma `Offer` model** — added to `schema.prisma` + a migration (see §F).
- [x] `offerProbation` / `offerContractDuration` accepted regardless of gating-field state
- [x] All 14 `offer_culture` fields treated as independent (incl. `offerEmployerTreatmentSignal`, `offerLeadershipStyle`)
- [x] Enum fields validated against `OgQuestions.options` (live), never a hardcoded list
- [x] `Other`-fallback: free text required when `Other` selected, capped per field
- [x] `GET /wizard-draft` — resume in-progress draft, 404 if none
- [x] `PUT /wizard-draft` — upsert, accepts arbitrary partial JSON (no `OgQuestions` validation)
- [x] `DELETE /wizard-draft` — clear on completion/restart
- [~] Wizard draft works before SCR-001 exists
  - Note: `WizardDraft` model loosened (identity-keyed, `candidateProfileId` optional,
    best-effort backfill). This was a design change beyond the raw handoff — flagged &
    chosen during planning because the charter allows autosave before profile creation.

## D. Epic 4.3 — Reference/Config read endpoints (public)

- [x] `GET /config/questions?screen=` — exact `QuestionPublic` shape, **no scoring data leaked**
      (no `score`, `category`, `yesNoScores`, `ratingMultiplier`, `options[].active`)
- [x] `GET /config/consent-toggles` — active toggles, **master toggle first**
- [x] `GET /config/geography` — country list, or a country's cities via `?countryCode=`
- [x] `GET /config/functional-domains` — flat, active, ordered
- [x] All 4 serve Sprint 3 seed data

## E. Explicitly OUT of scope (Sprint 5+) — correctly NOT implemented

- [ ] `POST /offers/{offerId}/compute-score` — Sprint 5 (scoring engine)
- [ ] `GET /offers/{offerId}/score` — Sprint 5
- [ ] `GET /evaluation-sessions/{sessionId}/compare` — Sprint 5
- [ ] All `/admin/config/*` routes + interim admin gate — Sprint 5
- [ ] Full RBAC / `middleware.ts` — Sprint 9
- [ ] Frontend consumption — Sprint 6-7

## F. Schema / migration

- [x] `schema.prisma`: added `offer_functional_domain`, `offer_received_date` to `Offer`
- [x] Migration written: `prisma/migrations/20260807000000_add_offer_functional_domain_and_received_date/`
- [~] Applied to **LOCAL** dev DB via targeted `ALTER TABLE` (`prisma db execute`) + `migrate resolve`
  - Note: `prisma migrate dev` was **not** used — it wanted to reset the whole DB due to
    unrelated drift (`sanjeedausers`/`users`/`forgot_password` tables Prisma doesn't manage).
  - ⚠️ **ACTION FOR YOU:** run this migration against **production** before/at deploy.

## G. Verification (all run live against local MySQL + Mongo Atlas)

- [x] `npx tsc --noEmit` clean for all Sprint 4 files (only pre-existing `pgp-*` errors remain)
- [x] Fresh guest → `GET` 404 + cookie → `POST` 201 → `PATCH` 200
- [x] Consent update 200; invalid toggle key → 400
- [x] `claim-guest-profile`: 401 without bearer; links with bearer+cookie; no-op without cookie
- [x] `POST /evaluation-sessions` stamped scoring config version 2
- [x] Offer create with all 11 SCR-003 fields; compensation + all-14 culture writes
- [x] `GET /offers/{id}` full join returns all sub-resources
- [x] Invalid enum value → 400 (live `OgQuestions` check)
- [x] Ownership: a different guest gets 404 on someone else's offer
- [x] `DELETE /offers/{id}` → 204, then 404 (after the transaction fix)
- [x] `wizard-draft` PUT/GET/DELETE round-trip; 404 after delete
- [x] All 4 config endpoints return correct shape/order
- [x] Test rows cleaned from local DB; dev server stopped; temp files removed

## H. Incidental fixes made along the way

- [x] `.claude/launch.json` pointed at nonexistent `dev:frontend` script → changed to `dev`
- [x] Installed `@prisma/adapter-mariadb` (Prisma 7 driver-adapter requirement)
