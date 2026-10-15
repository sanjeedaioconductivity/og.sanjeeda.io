'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, CloudUpload, PencilLine, UsersRound } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '../_components/AppShell';
import { PageHeading, SafeNote } from '../_components/ui';
import { useCv3d, type StartMethod } from '../_lib/store';

/** Screen 3 — Start Method: upload a CV, build manually, ask a mentor, or skip. */

const OPTIONS: {
  id: StartMethod;
  title: string;
  body: string;
  icon: typeof CloudUpload;
  tile: string;
  recommended?: boolean;
}[] = [
  {
    id: 'upload',
    title: 'Upload Existing CV',
    body: 'Upload your current CV and we will organize it into your 9 profile dimensions.',
    icon: CloudUpload,
    tile: 'bg-[hsl(var(--cv-primary-soft))] text-[hsl(var(--cv-primary-ink))]',
    recommended: true,
  },
  {
    id: 'manual',
    title: 'Build Profile Manually',
    body: 'Enter your knowledge, skills, projects, education, certifications, trainings, attributes, experience and exposure yourself.',
    icon: PencilLine,
    tile: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300',
  },
  {
    id: 'mentor',
    title: 'Get Mentor Help',
    body: 'Request Sanjeeda mentor support to structure and strengthen your profile.',
    icon: UsersRound,
    tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  {
    id: 'skip',
    title: 'Skip for now and go to dashboard',
    body: 'You can complete your profile later from your dashboard.',
    icon: ArrowRight,
    tile: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
  },
];

const NEXT: Record<StartMethod, string> = {
  upload: '/3d-cv/upload',
  manual: '/3d-cv/basic-profile',
  mentor: '/3d-cv/basic-profile',
  skip: '/3d-cv/dashboard',
};

export default function StartPage() {
  const router = useRouter();
  const { chooseStart } = useCv3d();

  function pick(method: StartMethod) {
    chooseStart(method);
    if (method === 'mentor') {
      toast.success('Mentor support requested. Meanwhile, confirm your basic details.');
    }
    router.push(NEXT[method]);
  }

  return (
    <AppShell>
      <PageHeading
        title={
          <>
            How would you
            <br />
            like to start?
          </>
        }
        subtitle="Upload your existing CV or build your 3D profile step by step."
      />

      <div className="space-y-3">
        {OPTIONS.map(({ id, title, body, icon: Icon, tile, recommended }) => (
          <button
            key={id}
            type="button"
            onClick={() => pick(id)}
            className={`relative flex w-full items-start gap-4 rounded-2xl border bg-card p-4 text-left transition hover:border-[hsl(var(--cv-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--cv-primary))] ${
              recommended ? 'border-[hsl(var(--cv-primary)/0.5)]' : 'border-border'
            }`}
          >
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tile}`}>
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{title}</span>
                {recommended && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    Recommended
                  </span>
                )}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{body}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <SafeNote>Your profile is safe and you can come back anytime to complete it.</SafeNote>
      </div>
    </AppShell>
  );
}
