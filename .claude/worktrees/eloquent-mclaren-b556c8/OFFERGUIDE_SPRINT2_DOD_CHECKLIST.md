# OfferGuide — Sprint 2 (Theming & Shared UI): Definition of Done

**Status: 4 of 5 code-complete & verified. Item 5 is the human review gate.**

Each item is checked against the actual code, with the file to open and a one-line way to prove it live.

---

## ✅ 1. ThemeProvider — light / dark / system, persists across reload
- **File:** `src/components/theme-provider.tsx`
- Three states: `type Theme = 'light' | 'dark' | 'system'`
- System follows the OS via `matchMedia('(prefers-color-scheme: dark)')`
- Applies the theme: `root.classList.toggle('dark', …)` on `<html>`
- Persists to `localStorage['portal-theme']`; re-read on load + anti-flash script in `src/app/layout.tsx`
- **Show it:** click the header ☀️/🌙/🖥️ toggle → refresh → theme sticks.

## ✅ 2. Dark-mode color source documented (approved OR explicit placeholder)
- **File:** `src/app/globals.css` — comment block `⚠ DARK-THEME TOKEN SOURCE — PLACEHOLDER, PENDING DESIGN SIGN-OFF`
- Placeholder `.dark` tokens derived from prototype accents on a navy ground:
  - `--background: 232 77% 10%` (navy `#060b2d`)
  - `--primary: 214 91% 50%` (blue `#0b6ff3`)
  - `--accent: 179 100% 33%` (teal `#00a7a4`)
  - `--destructive: 351 82% 62%` (red `#ee4f61`)
- **Open follow-up (non-blocking):** get approved dark tokens from Jamil, then swap the values in this same block — the engine doesn't change.

## ✅ 3. All 11 shadcn components in `components/ui/`, verified in both modes
- **Folder:** `src/components/ui/` (portal-wide, not the OfferGuide feature folder)
- 11 files: `button, input, card, dialog, select, tabs, tooltip, progress, badge, label, separator`
- Verified in light & dark on a throwaway test page, removed before merge (as the DoD requires).
- **Show it:** open `src/components/ui/` → 11 files; import anywhere via `@/components/ui/…`.

## ✅ 4. Plain OfferGuide nav entry — no permission logic, visible to all
- **File:** `src/app/components/nav/Header.tsx` — `<Link href="/offerguide">` in the desktop nav **and** mobile drawer
- No gating: no `usePermission`, no role / `isAdmin` / `isRegistered` check, no `{condition && …}` wrapper. "permission" appears only in comments explaining there is none.
- Points at the future Sprint-6 landing route (intentional placeholder link for now).
- **Show it:** view the site signed-out and signed-in → OfferGuide renders identically.

## 🟡 5. Reviewed before merge  — *Ready for review (human sign-off)*
- Build compiles clean: `npx tsc --noEmit` reports only one pre-existing, unrelated error (`swagger-ui-react` types), nothing from this sprint.
- Every change self-verified in the browser in both themes.
- **What "reviewed before merge" means:** before folding this branch into main, have a teammate/lead read the changes and approve (a pull-request review). This layer is the foundation every later screen builds on, so it's worth a careful look even though the individual tasks were small.
- **To close it:** open a PR → get a reviewer's approval → merge.

---

## Prove it in 60 seconds (live demo)
1. Open the site → find the ☀️/🌙/🖥️ button in the header (next to Login).
2. Click it → the whole site recolors Light → Dark → System.
3. Press **F5** to reload → the theme sticks.
4. Point at the nav → OfferGuide is there, same for guest and logged-in.
5. Open `src/components/ui/` → 11 components.

```bash
npx tsc --noEmit
```

_Bottom line: DoD items 1–4 are code-complete and verified; item 5 is the review gate that's yours to close._
