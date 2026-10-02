# Sanjeeda.io — OfferGuide & PGP: status, audit and plan (21 Sep 2026)

Companion to `SANJEEDA_OFFERGUIDE_PGP_PLAN.xml` (MS Project XML — open with **File › Open** in Microsoft Project; every task carries these findings in its Notes field, plus predecessors and durations you can edit).

**How to open:** Project 2010+ → File › Open → choose *XML Format (\*.xml)* in the file-type box → pick the file → "As a new project".

Legend: ✔ data reaches the admin · ✘ gap · ◐ partial

---

## 1. OfferGuide — where it stands

| Sprint | Scope | Status | Evidence |
|---|---|---|---|
| 1 | Prisma, Swagger UI, shadcn, scaffold | **Done** | `OFFERGUIDE_SPRINT1_CHECKLIST.md` |
| 2 | Theme (light/dark/system), tokens, 11 shadcn components, nav entry | **Done** | `OFFERGUIDE_SPRINT2_DOD_CHECKLIST.md` (item 5 = PR review) |
| 3 | 6 Mongo config collections + WizardDraft + seed | **Done** | `Offer Guide Sprints/Sprint3` |
| 4 | Candidate API (profile/session, offers, wizard draft, config reads) | **Done** | `OFFERGUIDE_SPRINT4_DOD_CHECKLIST.md` |
| 5 | Scoring engine, compute/score/compare, admin config API (30 ops) | **Done** | `OG_Sprint5_Handoff`, `src/lib/offerguide/scoring` |
| 6 | Wizard SCR-000 → SCR-005 | **Done** | 130/141 lines; JWT path verified later |
| 7 | Wizard SCR-006 → SCR-010 | **Done in code** | pages exist + tests; the .md checklist was never re-ticked (47/113) |
| 8 | Integration & QA (contract test, fixtures, Swagger badges) | **Done (automated)** | manual sheet Parts C–E still unticked |
| 9 | RBAC, roles script, `proxy.ts`, permission map | **Done** | 34/37 — 3 post-production checks open |
| 10 | Admin Configuration UI (6 screens, activate/preview, yesno removal, 10.7 fix) | **Done** | `OFFERGUIDE_SPRINT10_WHAT_I_BUILT.pdf`, 617 tests |
| post | og.sanjeeda.io, `NEXT_PUBLIC_SHOW_OFFERGUIDE`, header promo, palettes, explainer video | **Done** | git 15–17 Sep |

### QA Report — Sir Jamil, 16 Sep 2026 (og.sanjeeda.io)

| # | Sev | Finding | State in code today | Left to do |
|---|---|---|---|---|
| B2 | Critical | Phantom blank "Offer B" in Compare | ◐ fixed in working tree (`useWizardContext.ts`, `offer/page.tsx`, `compare/page.tsx`) — **uncommitted** | commit, test, re-verify repro |
| A2 | High | Base-salary placeholder looks filled | ◐ fixed in working tree (`compensation/page.tsx`) | commit |
| A1 | High | Stepper breadcrumb not clickable | ◐ fixed in working tree (`ModuleStepper.tsx`, new `useWizardProgress.ts`) | commit, test jump redirects |
| B1 | High | No "start new evaluation" | ◐ fixed in working tree (`LandingCta.tsx`, `setup/page.tsx` `?session=new`) | commit |
| A3 | Medium | 5–9 s per step transition | ◐ partial (`useReferenceData` cache, autosave, `WizardShell` no full-page Loading) | measure on prod, commit |
| B4 | Medium | Salary score not sensitive to base | ◐ fixed in working tree (`persistOfferScore.ts`) | regression test, commit |
| B5 | Low | Market panel doesn't name the offer | ◐ copy fixed (`scr009.ts`) | commit |
| A4 | Medium | Console `SyntaxError: Unexpected identifier 's'` | ✘ open | check the inline theme/palette script in `layout.tsx` on a prod build |
| A5 | Low | Transient blue band | ✘ open | body vs. layout surface, fixed CompensationBar |
| B3 | — | "+ Add another offer" | ✔ confirmed working | — |

Then: commit/push the branch (32 modified + 5 untracked files on `theme-palettes`) → full test suite → deploy → **QA re-test by Sir Jamil** → sign-off.

Sprint leftovers still needing a human: Sprint 8 manual QA Parts C–E; Sprint 9 post-production regression + Part B; Sprint 10 `check-yesno-count.mjs --prod` and the visual pass of `/offerguide/admin/scoring`.

---

## 2. PGP — screen-by-screen audit

Question asked of every screen: **what does it save, and does the admin see it in the right tab?**

### Candidate screens (`/candidate/dashboard`)

| Screen | Writes to | Admin sees it in | Verdict |
|---|---|---|---|
| Application Form (16 fields, 4 steps) | `CandidateApplication` | Candidates tab › drawer (all fields), status → *Submitted*, Dashboard KPI | ✔ — but no accept/reject decision, not in Monitoring |
| Document Uploader (CV, certificates, CNIC, other) | GridFS `candidateDocs` | Candidates tab › drawer › Documents (view/download) | ✔ — not in Monitoring |
| Programs tab — Join / Leave / Make active | `CandidateApplication.enrolledProgramIds`, `assignedProgramId` | Enrollments tab, Candidates drawer *Assigned Program*, Attendance tab (active only), mentor Students (active only) | ✔ — but ✘ Draft/Paused programs are joinable, ✘ no approval, ✘ login required to even see programs |
| Attendance tab | reads `Attendance` | same numbers as admin/mentor | ✔ |
| Profile photo | GridFS | Candidates tab avatar | ✔ |
| `/candidate/program/[id]` (7 read tabs) | reads `PGPProgram` | — | ✔ read-only; ✘ nothing personal (no my-progress, submissions, scores, feedback) |

### Mentor screens (`/mentor/dashboard`, `/mentor/program/[id]`)

| Screen | Writes to | Admin sees it in | Verdict |
|---|---|---|---|
| Sign-up (Pending) | `MentorUser`, `ActivityLog` | Mentors tab (Pending badge, signup date), Monitoring | ✔ |
| Dashboard — assigned programs & students | reads | Programs tab (assigned mentor) | ✔ |
| **Assigned Candidates** tab | — | — | ✘ placeholder — renders the Dashboard component |
| **Feedback** tab | — | — | ✘ placeholder — renders the Dashboard component; no feedback model exists |
| Update Progress (weekly / capstone / portfolio status) | `PGPProgram.<section>[i].status` + `ActivityLog` | Monitoring tab, Program Dashboard view, Dashboard avg-completion | ✔ — but statuses are **program-level, not per candidate**; `evidenceLink` / `facilitatorRemarks` not editable; no scores against the Evaluation Plan |
| Attendance grid | `Attendance` (upsert) | Attendance tab + per-program grid | ✔ — ✘ not written to ActivityLog, so Monitoring never shows it; mentor grid lists *active-program* students only while the admin grid lists all enrolled |
| Profile photo | GridFS | Mentors tab avatar | ✔ |

### Admin screens (`/pgp-admin`)

| Tab | Reads | Controls | Gaps |
|---|---|---|---|
| Dashboard | candidates, mentors, programs | — | no attendance / enrollment KPI, no drill-down |
| Mentors | `MentorUser` | edit, Pending→Active/Rejected/Blocked, delete | — (complete) |
| Candidates | users + applications + GridFS | edit, assign program, PDF | ✘ cannot Block/Reject the account (`PATCH` never touches `CandidateUser.status`); ✘ no application decision; assign-program doesn't append to `enrolledProgramIds` |
| Programs | `PGPProgram` | create/edit master + 5 sheets, templates, assign mentor | ✘ no delete/archive/duplicate; ✘ `title`/`category` exist in the TS type but not in the Mongoose schema → silently dropped; ✘ `ProgramSchema` is re-declared in **8 route files** with different fields (first compiled wins — the same bug already fixed for `MentorUser`/`CandidateApplication`) |
| Enrollments | applications | — | read-only: cannot remove/approve, no seat cap |
| Attendance | `Attendance` | — | read-only, active program only, no export |
| Monitoring | `ActivityLog` (300) | text filter | ✘ mentor-only: no candidate events, no attendance events, no admin edits; API filters (`?programId`, `?mentorId`) not exposed in UI |

### Cross-cutting

* **No authentication on candidate and mentor APIs.** `candidate_token` / `mentor_token` cookies are issued at login but never verified; every `/api/pgp-candidate/*` and `/api/pgp-mentor/*` route trusts an `email` / `mentorId` from the query string or body. Dashboards gate on `localStorage`. `proxy.ts` documents this explicitly. `/pgp-admin` and `/api/pgp-management/*` **are** properly gated (portal role, since 17 Sep).

---

## 3. Proposed new screens

### Candidate (primary user — visitors come to explore programs)
1. **Public Program Catalogue** `/programs` — Active programs, category/duration filters, search, no login.
2. **Public Program Detail** `/programs/[id]` — curriculum preview, mentor, dates, promise, *Apply / Join* CTA.
3. **Application Status tracker** — Submitted → Under review → Accepted / Rejected (+ reason).
4. **Dashboard Home** — active program, next session, attendance %, pending items, latest feedback.
5. **My Progress** — per-candidate weekly / capstone / portfolio status.
6. **Portfolio Submissions** — upload evidence per item, see review status.
7. **Evaluation & Results** — scores per evaluation area, weighted total, grade.
8. **Feedback / Messages** — mentor feedback per week/item, replies.
9. **Announcements & Notifications** — in-app + email.
10. **Session Resources** — templates/materials per week.
11. **Certificate of completion** (PDF).
12. **Recommended programs** — from Khudi / PP assessments and OfferGuide profile.

### Mentor
* Per-candidate progress model + real **Assigned Candidates** screen · **Evaluation grading** (uses the 6 stored weightages) · real **Feedback** screen · **Portfolio review** · session notes.

### Admin
* **Applications review** (accept/reject) · **Evaluations overview** (+CSV) · **Portfolio submissions overview** · feedback oversight & inactivity flags in Monitoring · **Reports & exports** · **Certificates registry** · **Announcements composer**.

### Fixes before any of that
Consolidate `PGPProgram`/`Attendance` schemas into `src/models` → persist `category` (+ `visibility`, `seats`) → filter joinable programs to Active → candidate account status + application decision → program delete/archive/duplicate → enrollment approve/remove → log candidate & attendance events → authenticate the candidate/mentor APIs.
