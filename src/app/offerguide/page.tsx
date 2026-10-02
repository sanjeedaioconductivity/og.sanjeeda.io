import {
  Gauge,
  Lock,
  MessageCircleQuestion,
  Compass,
  FileText,
  SlidersHorizontal,
  TriangleAlert,
  UserRound,
} from 'lucide-react';
import LandingCta from './_components/landing/LandingCta';
import HeroCategoryStrip from './_components/landing/HeroCategoryStrip';
import {
  LANDING_FOOTER_DISCLAIMER,
  LANDING_HERO,
  LANDING_HOW_IT_WORKS,
  LANDING_PRIVACY_STRIP,
  LANDING_PRODUCT_NAME,
  LANDING_SECTION_HEADINGS,
  LANDING_WHAT_YOU_GET,
  LANDING_WHO_ITS_FOR,
} from './_constants/landingCopy';

/**
 * SCR-000 — Landing page. Display only, zero input fields.
 *
 * Sits OUTSIDE the 10-step flow, so there is deliberately no step badge, no module
 * stepper, no progress label and no Back/Next here — SCR-001 remains "Step 1 of 10".
 * Public: no auth gate, no permission check, and the CTA never routes to a login or
 * registration wall.
 *
 * Six sections, in the fixed order of FRS §4: hero, how it works, who it's for,
 * what you get, privacy strip, footer disclaimer. All copy lives in
 * _constants/landingCopy.ts and is reproduced verbatim.
 *
 * Not present, on purpose: consent toggles (captured on SCR-001), any market
 * intelligence or community statistics (no benchmark data exists at launch, and
 * implying otherwise is called out in FRS §5), and the help icon (SCR-000 has no
 * fields; ⓘ lands on SCR-008 in Sprint 7).
 */

const HOW_IT_WORKS_ICONS = [UserRound, FileText, SlidersHorizontal, Compass];
const WHAT_YOU_GET_ICONS = [Gauge, TriangleAlert, MessageCircleQuestion];

export default function OfferGuideLandingPage() {
  return (
    <main className="relative w-full overflow-hidden">
      {/* Decorative glow, dark mode only — soft blurred blue/red blobs echoing
          the header's gradient, so the flat slate surface reads with depth
          instead of as a plain block of colour. */}
      <div className="pointer-events-none absolute inset-0 -z-10 hidden dark:block" aria-hidden="true">
        <div className="absolute -left-16 -top-16 h-96 w-96 rounded-full bg-blue-500/40 blur-3xl" />
        <div className="absolute -right-16 top-40 h-96 w-96 rounded-full bg-red-500/35 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 pb-8 sm:px-6">
      {/* 1 — Hero. Full width above the fold; CTA visible without scrolling on
          both desktop and mobile, so this block stays short by design. */}
      <section className="pt-6 pb-6 sm:pt-8 sm:pb-7">
        <p className="text-lg font-semibold uppercase tracking-[0.10em] text-foreground">
          {LANDING_PRODUCT_NAME}
        </p>
        <h1 className="mt-2 max-w-3xl text-2xl font-bold leading-snug tracking-tight sm:text-xl">
          {LANDING_HERO.headline}
        </h1>
        <HeroCategoryStrip />
        <div className="mt-4">
          <LandingCta />
        </div>
      </section>

      <hr className="border-border" />

      {/* 2 — How it works. Four cards in a row on desktop, stacked on mobile. */}
      <section className="py-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {LANDING_SECTION_HEADINGS.howItWorks}
        </h2>
        <ol className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {LANDING_HOW_IT_WORKS.map((item, index) => {
            const Icon = HOW_IT_WORKS_ICONS[index];
            return (
              <li
                key={item.step}
                className="rounded-lg border border-border bg-card p-3.5 text-card-foreground"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {item.step}
                  </span>
                  <Icon
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-2 text-sm font-semibold text-muted-foreground">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-card-foreground">
                  {item.description}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <hr className="border-border" />

      {/* 3 — Who it's for. Positioning statement as a full-width lead line; three
          use cases as a list on mobile, three columns on desktop. */}
      <section className="py-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {LANDING_SECTION_HEADINGS.whoItsFor}
        </h2>

        <ul className="mt-3 grid grid-cols-1 gap-2.5 lg:grid-cols-3">
          {LANDING_WHO_ITS_FOR.useCases.map((useCase) => (
            <li
              key={useCase}
              className="flex gap-2 rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-card-foreground"
            >
              <span
                className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary"
                aria-hidden="true"
              />
              {useCase}
            </li>
          ))}
        </ul>
      </section>

      <hr className="border-border" />

      {/* 5 — Privacy strip. Full-width single line with a lock icon, above the
          footer disclaimer. Consistent with the privacy note on SCR-009. */}
      {/* <section className="rounded-lg border border-border bg-muted/50 px-3.5 py-2.5"> */}
        <p className="flex items-start gap-2 text-xs leading-relaxed ">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="text-slate-500 dark:text-slate-400">{LANDING_PRIVACY_STRIP}</span>
        </p>
      {/* </section> */}

      {/* 6 — Footer disclaimer. Muted, visually distinct from the content above.
          Consistent with the SCR-010 footer disclaimer. */}
      <p className="mt-4 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {LANDING_FOOTER_DISCLAIMER}
      </p>
      </div>
    </main>
  );
}
