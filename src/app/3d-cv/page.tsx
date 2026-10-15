import Link from 'next/link';
import { BarChart3, CloudUpload, FileText, ShieldCheck, UserCheck, UsersRound } from 'lucide-react';
import AppShell from './_components/AppShell';
import Logo3D from './_components/Logo3D';
import { Action } from './_components/ui';

/**
 * Screen 1 — Welcome / Landing. Introduces 3D CVs and sends the candidate to
 * signup, either to build a profile or to upload an existing CV first.
 */

const BENEFITS = [
  {
    icon: UserCheck,
    title: 'Build One Verified Profile',
    body: 'Add your knowledge, skills, projects, education, certifications, trainings, attributes, experience & exposure.',
    tile: 'bg-[hsl(var(--cv-primary-soft))] text-[hsl(var(--cv-primary-ink))]',
  },
  {
    icon: FileText,
    title: 'Generate Multiple CVs',
    body: 'Create different CV versions for different jobs.',
    tile: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
  },
  {
    icon: BarChart3,
    title: 'Improve Your Selection Chances',
    body: 'Get job-aligned language, readiness insights & career growth.',
    tile: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
  },
  {
    icon: ShieldCheck,
    title: 'Your Data is Safe',
    body: 'You control your profile. Only you decide which CV version to generate, download or share.',
    tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
];

export default function WelcomePage() {
  return (
    <AppShell>
      <div className="flex justify-end">
        <Link
          href="/auth"
          className="rounded-lg border border-[hsl(var(--cv-primary))] px-4 py-1.5 text-sm font-semibold text-[hsl(var(--cv-primary-ink))] hover:bg-[hsl(var(--cv-primary-soft))]"
        >
          Login
        </Link>
      </div>

      <Logo3D className="mt-2" />

      <section className="mt-6 text-center">
        <h1 className="text-2xl font-bold leading-snug sm:text-3xl">
          One verified profile.
          <br />
          Multiple job-specific CVs.
          <br />
          <span className="text-[hsl(var(--cv-primary-ink))]">Better chances of selection.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-base text-muted-foreground sm:text-lg">
          Create your 3D career profile once and generate ATS-ready CVs and cover letters for different jobs.
        </p>
      </section>

      <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
        {BENEFITS.map(({ icon: Icon, title, body, tile }) => (
          <li key={title} className="flex gap-4 p-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tile}`}>
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex gap-4 rounded-2xl border border-[hsl(var(--cv-primary)/0.25)] bg-[hsl(var(--cv-primary-soft))] p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card text-[hsl(var(--cv-primary-ink))]">
          <UsersRound className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h2 className="font-semibold">Need expert help?</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Sanjeeda mentors can help you build a stronger profile.</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Action look="primary" href="/3d-cv/signup">
          Create My 3D CV Profile
        </Action>
        <Action look="outline" href="/3d-cv/signup?then=upload">
          <CloudUpload className="h-5 w-5" aria-hidden />
          Upload Existing CV
        </Action>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Start free: generate up to 3 CV versions. Free versions expire after 3 weeks unless upgraded.
      </p>

      <p className="mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link href="/auth" className="font-semibold text-[hsl(var(--cv-primary-ink))] hover:underline">
          Login
        </Link>
      </p>
    </AppShell>
  );
}
