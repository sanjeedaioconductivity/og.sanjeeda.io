import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CloudUpload,
  FileText,
  Gauge,
  Layers3,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { DIMENSIONS, type DimensionId } from './_lib/dimensions';

/**
 * Screen 1 — Welcome / Landing.
 *
 * Laid out like the OfferGuide landing (offerguide/page.tsx) so Sanjeeda's
 * products read as one family: a plain surface (no coloured hero block), a
 * left-aligned max-w-4xl column, an uppercase product name over a short
 * headline, one primary call to action, then compact card sections separated
 * by rules. Same tokens too (bg-card, border-border, primary), and the same
 * dark-mode-only glow behind the page.
 *
 * Both calls to action lead to signup; "Upload" carries ?then=upload so signup
 * continues straight to the upload step.
 */

const STEPS = [
  {
    icon: Layers3,
    title: 'Build your profile once',
    body: 'Add knowledge, skills, projects, education and experience, or upload an old CV and we organise it.',
  },
  {
    icon: Briefcase,
    title: 'Add the job you want',
    body: 'Paste a job description. We read what the employer asks for and match it to your profile.',
  },
  {
    icon: FileText,
    title: 'Get a tailored CV',
    body: 'Download an ATS-ready CV and cover letter for that job, ordered for your career stage.',
  },
  {
    icon: Gauge,
    title: 'See your readiness',
    body: 'Get a readiness report: your strengths for the role and what to build next.',
  },
];

const BENEFITS = [
  { icon: BadgeCheck, text: 'Evidence-backed: attach certificates, letters and project links, and proven entries count for more.' },
  { icon: FileText, text: 'ATS-ready: clean, single-column CVs that applicant tracking systems can read.' },
  { icon: ShieldCheck, text: 'Nothing invented: you review and approve every CV before you download it.' },
];

const DIMENSION_ORDER: DimensionId[] = [
  'knowledge', 'skills', 'projects', 'education', 'certifications',
  'trainings', 'attributes', 'experience', 'exposure',
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{children}</h2>;
}

export default function WelcomePage() {
  return (
    // `isolate` keeps the -z-10 glow above the module surface's own background
    // (3d-cv/layout.tsx) instead of behind it.
    <div className="relative isolate w-full overflow-hidden">
      {/* Decorative glow, dark mode only — same as the OfferGuide landing. */}
      <div className="pointer-events-none absolute inset-0 -z-10 hidden dark:block" aria-hidden="true">
        <div className="absolute -left-16 -top-16 h-96 w-96 rounded-full bg-blue-500/40 blur-3xl" />
        <div className="absolute -right-16 top-40 h-96 w-96 rounded-full bg-red-500/35 blur-3xl" />
      </div>

      <main className="mx-auto w-full max-w-4xl px-4 pb-10 sm:px-6">
        {/* 1 — Hero. Short, so the call to action is visible without scrolling. */}
        <section className="pt-8 pb-7">
          <p className="text-lg font-semibold uppercase tracking-[0.10em] text-foreground">3D CVs</p>
          <h1 className="mt-2 max-w-3xl text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
            One verified profile. Multiple job-specific CVs. Better chances of selection.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Create your career profile once and generate ATS-ready CVs and cover letters for every job you apply to.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link
              href="/3d-cv/signup"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Create My 3D CV Profile
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/3d-cv/signup?then=upload"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CloudUpload className="h-4 w-4" aria-hidden="true" />
              Upload Existing CV
            </Link>
            <p className="text-xs text-muted-foreground">Free to start · 3 CV versions</p>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth" className="font-medium text-primary underline underline-offset-2 hover:no-underline">
              Log in
            </Link>
          </p>
        </section>

        <hr className="border-border" />

        {/* 2 — How it works. Four cards in a row on desktop, stacked on mobile. */}
        <section className="py-6">
          <SectionLabel>How it works</SectionLabel>
          <ol className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="rounded-lg border border-border bg-card p-3.5 text-card-foreground">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <h3 className="mt-2 text-sm font-semibold text-muted-foreground">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-card-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <hr className="border-border" />

        {/* 3 — The nine dimensions every CV is built from. */}
        <section className="py-6">
          <SectionLabel>Your 3D profile: nine dimensions</SectionLabel>
          <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {DIMENSION_ORDER.map((id) => (
              <li key={id} className="flex gap-2 rounded-lg border border-border bg-card p-3 text-card-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span>
                  <span className="block text-xs font-semibold">{DIMENSIONS[id].label}</span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">{DIMENSIONS[id].blurb}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <hr className="border-border" />

        {/* 4 — Why it helps. */}
        <section className="py-6">
          <SectionLabel>Why 3D CVs</SectionLabel>
          <ul className="mt-3 grid grid-cols-1 gap-2.5 lg:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex gap-2 rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-card-foreground"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </section>

        {/* Closing call to action, so the page never ends without a way in. */}
        <section className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-card-foreground">Ready to build your 3D CV?</p>
            <p className="text-xs text-muted-foreground">Free to start. It takes about two minutes to create your account.</p>
          </div>
          <Link
            href="/3d-cv/signup"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Create My 3D CV Profile
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>

        <hr className="mt-6 border-border" />

        {/* 5 — Privacy line and mentor note, muted, like the OfferGuide footer. */}
        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="text-slate-500 dark:text-slate-400">
            You control your profile. Only you decide which CV version to generate, download or share.
          </span>
        </p>
        <p className="mt-4 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Free CV versions are kept for 3 weeks. Need expert help? Sanjeeda mentors can help you strengthen your profile.
        </p>
      </main>
    </div>
  );
}
