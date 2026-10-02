'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LANDING_HERO } from '../../_constants/landingCopy';
import { FIRST_SCREEN, resumeHrefFor } from '../../_constants/screens';

/**
 * SCR-000's single primary CTA.
 *
 * Label and destination adapt to whether an evaluation is already in progress
 * (SCR-000 FRS §6.1 + §7):
 *   - no draft            → "Start your evaluation" → SCR-001
 *   - saved WizardDraft   → "Continue where you left off" → the last saved step
 *   - draft expired (30d) → treated as a first visit, with NO error state
 *
 * Renders the first-visit label immediately and upgrades to the resume label once
 * the draft lookup lands. That ordering matters: the FRS requires the CTA to be
 * visible without scrolling, so it must never wait on a fetch to paint.
 *
 * `GET /wizard-draft` answers 404 both for "no identity yet" and "no draft" — the
 * Sprint 4 route treats that as a normal empty state, not an error, so every
 * non-200 here simply means first visit. TTL expiry is enforced by the Mongo TTL
 * index; nothing about it is computed on the client.
 *
 * The resume state also shows a secondary "Start a new evaluation" link. The
 * guest identity is an httpOnly cookie, so a candidate cannot "reset" by
 * clearing site storage — without this link there was no way to evaluate a
 * second offer once a session existed (QA report B1). `?session=new` tells
 * SCR-002 to create a fresh session instead of locking onto the latest one.
 *
 * This link never points at a login or registration wall. A guest completes the
 * entire wizard with no account.
 */
const START_NEW_HREF = `${FIRST_SCREEN.href}?session=new`;

export default function LandingCta() {
  const [href, setHref] = React.useState<string>(FIRST_SCREEN.href);
  const [label, setLabel] = React.useState<string>(LANDING_HERO.ctaFirstVisit);
  const [resuming, setResuming] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function findSavedDraft() {
      try {
        const res = await fetch('/api/offerguide/wizard-draft', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) return; // 404 = first visit or expired draft. Not an error.

        const draft = (await res.json()) as { currentScreen?: string } | null;
        if (cancelled || !draft?.currentScreen) return;

        setHref(resumeHrefFor(draft.currentScreen));
        setLabel(LANDING_HERO.ctaResume);
        setResuming(true);
      } catch {
        /* Offline or blocked — fall through to the first-visit CTA. */
      }
    }

    findSavedDraft();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href={href}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {label}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>

        <p className="text-xs text-muted-foreground">{LANDING_HERO.timeHint}</p>
      </div>

      {resuming && (
        <p className="mt-2 text-xs text-muted-foreground">
          {LANDING_HERO.ctaStartNewLead}{' '}
          <Link
            href={START_NEW_HREF}
            className="font-medium text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {LANDING_HERO.ctaStartNew}
          </Link>
        </p>
      )}
    </div>
  );
}
