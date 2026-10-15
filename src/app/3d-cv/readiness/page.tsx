'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../_components/AppShell';
import { Action, PageHeading } from '../_components/ui';
import { isExpired } from '../_lib/cv';
import { useCv3d } from '../_lib/store';

/** Readiness tab: opens the report for the newest live CV version. */
export default function ReadinessIndex() {
  const router = useRouter();
  const { state, hydrated } = useCv3d();
  const latest = state.versions.find((v) => !isExpired(v));

  useEffect(() => {
    if (hydrated && latest) router.replace(`/3d-cv/readiness/${latest.id}`);
  }, [hydrated, latest, router]);

  if (!hydrated || latest) return <AppShell tabs>{null}</AppShell>;
  return (
    <AppShell tabs>
      <PageHeading
        title="No readiness report yet"
        subtitle="Generate a CV for a job and we will show how ready you are for it, and what to build next."
      />
      <Action look="primary" href="/3d-cv/job">
        Add a Job Description
      </Action>
    </AppShell>
  );
}
