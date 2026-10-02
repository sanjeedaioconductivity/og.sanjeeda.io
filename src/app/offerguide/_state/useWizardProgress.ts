'use client';

import * as React from 'react';
import * as api from './api';
import { useWizardContext } from './useWizardContext';
import type { WizardScreenId } from '../_constants/screens';

/**
 * What the wizard chrome needs to know about the run in progress: which steps
 * have been saved, and whether Quick Compare can produce a result yet.
 *
 * ------------------------------- `completed` -------------------------------
 *
 * The module stepper used to paint every step before the current one as done,
 * which was true only as long as the wizard could be walked one Next at a
 * time. Now that a step name is a jump, a candidate on step 6 may never have
 * touched 4 and 5 — and a green tick on those claims they did.
 *
 * "Done" is read from MySQL, the system of record, rather than tracked in the
 * draft or the browser: every screen already leaves a row behind when it is
 * saved, so nothing new has to be written and a second device or an expired
 * draft sees the same ticks.
 *
 *   SCR-001  a candidate profile exists
 *   SCR-002  the session exists
 *   SCR-003  the offer exists (employment type and work arrangement are
 *            required at creation, so existence is completion)
 *   SCR-004…008  the offer's per-step child row exists — compensation,
 *            benefitsSecurity, workLife, growth, culture
 *   SCR-009  a score has been stored, which Compare does the first time it
 *            loads the offer
 *   SCR-010  never — it is the report, there is nothing after it to be done for
 *
 * Steps 4–9 are per offer, so on a second offer's screens they start blank
 * even though the first offer went all the way through.
 *
 * ---------------------- `interestCount` / `hasOffer` ----------------------
 *
 * CR-02's gate: Quick Compare generates a result only once at least three
 * interests are selected, and only once there is an offer to score. Both are
 * read here rather than in the button, because this hook already holds the
 * session/offer context the chrome renders from — a second hook would mean a
 * second `useWizardContext` instance and a second round of id resolution.
 *
 * `interestCount` is 0 until the session exists, which is correct: before
 * SCR-002 is submitted nothing has been chosen, so the shortcut stays shut.
 *
 * Returns nulls until the first read lands. The last result per session/offer
 * is kept for the life of the page bundle so the step after a save renders
 * with the ticks it had a moment ago rather than blank-then-green, and the
 * fresh read then adds the step that was just saved.
 */

export type WizardProgress = {
  /** Null while the first read is still in flight. */
  completed: ReadonlySet<WizardScreenId> | null;
  /** How many evaluation priorities the session carries. */
  interestCount: number;
  /** An offer exists with its compensation saved — the minimum to score. */
  hasScorableOffer: boolean;
};

export function useWizardProgress(): WizardProgress {
  const { sessionId, offerId, resolving } = useWizardContext();
  const key = cacheKey(sessionId, offerId);

  const [progress, setProgress] = React.useState<WizardProgress>(
    () => cache.get(key) ?? EMPTY,
  );

  React.useEffect(() => {
    if (resolving) return;
    let cancelled = false;

    // The ids may only be known now, if the URL carried none and the context
    // hook had to infer them.
    const cached = cache.get(key);
    if (cached) setProgress(cached);

    async function load() {
      const [hasProfile, offer, score, session] = await Promise.all([
        // A session cannot exist without a profile, so only the pre-session
        // screens need to ask.
        sessionId
          ? true
          : api
              .getCandidateProfile()
              .then((p) => p !== null)
              .catch(() => false),
        offerId ? api.getOffer(offerId).catch(() => null) : null,
        offerId ? api.getOfferScore(offerId) : null,
        sessionId ? api.getEvaluationSession(sessionId).catch(() => null) : null,
      ]);
      if (cancelled) return;

      const done = new Set<WizardScreenId>();
      if (hasProfile) done.add('SCR-001');
      if (sessionId) done.add('SCR-002');
      if (offer) {
        done.add('SCR-003');
        if (offer.compensation) done.add('SCR-004');
        if (offer.benefitsSecurity) done.add('SCR-005');
        if (offer.workLife) done.add('SCR-006');
        if (offer.growth) done.add('SCR-007');
        if (offer.culture) done.add('SCR-008');
      }
      if (score) done.add('SCR-009');

      const next: WizardProgress = {
        completed: done,
        interestCount: session?.evaluationPriorities?.length ?? 0,
        hasScorableOffer: Boolean(offer?.compensation),
      };

      cache.set(key, next);
      setProgress(next);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [resolving, sessionId, offerId, key]);

  return progress;
}

const EMPTY: WizardProgress = {
  completed: null,
  interestCount: 0,
  hasScorableOffer: false,
};

const cache = new Map<string, WizardProgress>();

function cacheKey(sessionId: number | null, offerId: number | null) {
  return `${sessionId ?? '-'}:${offerId ?? '-'}`;
}
