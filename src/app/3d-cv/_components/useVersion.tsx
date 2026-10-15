'use client';

import { useMemo } from 'react';
import AppShell from './AppShell';
import { Action, PageHeading } from './ui';
import { isExpired, planCv, type CvPlan } from '../_lib/cv';
import { useCv3d } from '../_lib/store';

/**
 * Loads a saved CV version and its derived plan, or returns the screen to show
 * instead (still loading, not found, expired).
 */
export function useVersion(id: string): { plan: CvPlan; fallback: null } | { plan: null; fallback: React.ReactElement } {
  const { state, hydrated } = useCv3d();
  const version = state.versions.find((v) => v.id === id);
  const plan = useMemo(() => (version ? planCv(version) : null), [version]);

  if (!hydrated) return { plan: null, fallback: <AppShell tabs>{null}</AppShell> };
  if (!version || !plan) {
    return {
      plan: null,
      fallback: (
        <AppShell tabs>
          <PageHeading title="CV not found" subtitle="It may have been deleted. Your saved versions are in Downloads." />
          <Action look="primary" href="/3d-cv/downloads">
            Go to My CVs
          </Action>
        </AppShell>
      ),
    };
  }
  if (isExpired(version)) {
    return {
      plan: null,
      fallback: (
        <AppShell tabs>
          <PageHeading
            title="This CV version has expired"
            subtitle="Free CV versions expire after 3 weeks. Your master profile is safe; generate a fresh version any time."
          />
          <Action look="primary" href="/3d-cv/job">
            Generate a New CV
          </Action>
        </AppShell>
      ),
    };
  }
  return { plan, fallback: null };
}
