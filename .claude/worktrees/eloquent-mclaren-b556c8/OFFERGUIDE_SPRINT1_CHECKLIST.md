# OfferGuide — Sprint 1 Execution Checklist (Phase 0 & Phase 1)

> Source of truth for what was executed. Each item lists **what was done** and **how YOU verify it independently**.
> Status legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` needs your decision/attention

---

## Phase 0 — Confirm before touching anything

- [x] **P0.1 — Identify the existing MySQL target (reuse, do NOT create a new DB)**
  - Done: Confirmed the portal connects via `src/utils/mysql.ts` using env vars in `.env.local`:
    `DB_HOST=127.0.0.1`, `DB_USER=root`, `DB_NAME=user_management`, `DB_PORT=3306`.
  - Prisma will point at this same instance/database — no new DB created.
  - **Verify:** open `src/utils/mysql.ts` and `.env.local` — the `DB_*` values match the Prisma `DATABASE_URL` (see P1.1).

- [x] **P0.2 — Confirm ".env is gitignored"** (so DB creds aren't committed)
  - Done: `.gitignore` line 34 has `.env*`.
  - **Verify:** run `git status` after Phase 1 — `.env` should NOT appear as a tracked/new file.

- [!] **P0.3 — Password migration strategy (needed for Phase 2, NOT Phase 1)**
  - Decision required from you before I write the migration script in Phase 2.
  - My recommendation: **lazy re-hash on next successful login** (no forced password resets).
  - This does NOT block Phase 1. Flagged here so it's not forgotten.

---

## Phase 1 — Package Setup (Epic 1.1)

### P1.1 — Prisma  ✅ DONE
- [x] Install `prisma` (dev) + `@prisma/client`
- [x] `npx prisma init --datasource-provider mysql` (created `prisma/schema.prisma`, `prisma.config.ts`, `.env`)
- [x] Set `DATABASE_URL="mysql://root:cs123@127.0.0.1:3306/user_management"` in `.env`
- [x] Verified connection: `npx prisma db pull --print` connected (exit 0) and listed `userinfo` (+ `users`, `forgot_password`). `schema.prisma` left at init default — NO schema changes.
- ⚠ Note found during introspection: DB `userinfo` PK is `user_id`, but app code uses `user.id` — pre-existing mismatch to address in Phase 2 (bcrypt story), not Sprint 1 tooling.
- **How YOU verify:**
  - Run `npx prisma studio` → a browser opens at `http://localhost:5555` listing existing tables including `userinfo`.
  - Confirm `git diff` shows **no** new schema models (schema.prisma left at the init default).

### P1.2 — Swagger UI + JWT deps  (files done; install in progress)
- [~] Install `swagger-ui-react` and `cookie` (`jsonwebtoken` already present) — running
- [x] Create `src/app/api-docs/page.tsx`
- [x] Create placeholder `public/openapi.yaml`
- **How YOU verify:**
  - Run `npm run dev`, open `http://localhost:3000/api-docs` → Swagger UI renders the placeholder spec with a "Try it out" button, no console errors.

### P1.3 — shadcn/ui  ⛔ BLOCKED — awaiting your decision
- Blocker: shadcn's current CLI is **v4.16.0 (targets Tailwind v4)**; portal is **Tailwind v3.4.17**.
  Running current shadcn could migrate the whole portal to Tailwind v4 (breaks every existing page).
- At-risk files backed up before any attempt (tailwind.config.ts, globals.css, tsconfig.json, package.json).
- Decision needed: (a) pin shadcn v2 to keep Tailwind v3 [recommended], (b) upgrade to Tailwind v4 + shadcn v4, or (c) manual setup.
- [ ] `shadcn init` (approach TBD per decision)
- [ ] Enable `darkMode: 'class'` in tailwind config
- [ ] Add one throwaway `button`, verify dark-mode toggle on a temp page, then delete the temp page
- **How YOU verify:**
  - `components.json` exists; `src/components/ui/button.tsx` exists.
  - On the temp test page, toggling `class="dark"` on `<html>` visibly changes the button — then confirm the temp page is deleted before merge.

### P1.4 — OfferGuide folder scaffold (empty, no logic)  ✅ DONE
- [x] `src/app/offerguide/_components/`, `_state/`, `_constants/` (with `.gitkeep`)
- [x] `src/app/api/offerguide/` (with `.gitkeep`; kebab-case route segments later)
- **How YOU verify:**
  - `git status` shows the new empty folders (via `.gitkeep`) under `src/app/offerguide/` and `src/app/api/offerguide/`, matching NAMING_CONVENTIONS.

---

## Notes on repo reality (vs. the handoff diagram)
- This is a **single Next.js App Router app** (`src/app/`), not the `apps/web` + `server/` monorepo in the PDF. Scaffold is adapted to the real layout per the handoff's own "follow the existing structure" instruction.
- `bcrypt` AND `bcryptjs` are both installed — to standardize on one in Phase 2.
