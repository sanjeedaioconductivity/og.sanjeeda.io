'use client';

import * as React from 'react';
import * as api from './api';
import type { WizardScreenId } from '../_constants/screens';

const DEBOUNCE_MS = 800;

/**
 * Debounced wizard-draft autosave.
 *
 * The handoff's draft policy: a debounced write to `/wizard-draft` on field blur
 * and on every step change. This hook covers both — `scheduleSave` for the
 * debounced blur path, `saveNow` for the step change, which cancels the pending
 * timer and writes immediately. Callers do NOT await it before navigating: the
 * write is best-effort, `api.saveWizardDraft` serialises writes so an earlier
 * one can never overtake a later one, and waiting on it was a full extra round
 * trip on every step transition (QA report A3).
 *
 * Deliberately fire-and-forget. WizardDraft is NOT the system of record — MySQL is,
 * through /candidate-profile and /offers/*. A failed draft write costs the
 * candidate a resume point, not their data, so it must never surface an error or
 * block navigation. `saveWizardDraft` already swallows failures; this hook just
 * makes sure a pending timer can't fire after unmount.
 *
 * The 30-day TTL is enforced by the Mongo TTL index from Sprint 3. Nothing here
 * computes, checks or reacts to expiry — an expired draft simply reads as 404,
 * which the callers treat as a first visit.
 */
export function useDraftAutosave(screenId: WizardScreenId) {
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = React.useRef<Record<string, unknown>>({});

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const scheduleSave = React.useCallback(
    (answers: Record<string, unknown>) => {
      latestRef.current = answers;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void api.saveWizardDraft(screenId, latestRef.current);
      }, DEBOUNCE_MS);
    },
    [screenId],
  );

  /** Flush now — used on step change, before the route moves. */
  const saveNow = React.useCallback(
    async (answers: Record<string, unknown>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      await api.saveWizardDraft(screenId, answers);
    },
    [screenId],
  );

  return { scheduleSave, saveNow };
}
