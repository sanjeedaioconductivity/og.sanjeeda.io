'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as api from './api';

/**
 * Resolves which evaluation session — and, from SCR-003 onward, which offer —
 * the candidate is currently working on.
 *
 * SCR-002 is shown once per session, not repeated when a second or third offer is
 * added, and SCR-003 is "repeated for each additional offer when
 * evaluation_offer_count = Multiple offers" (SCR-003 FRS §2). So session and offer
 * identity can't just be "the most recent one" once multi-offer sessions exist —
 * they need to travel through the wizard explicitly. `?session=` and `?offer=`
 * query params carry that, which also keeps a screen reload or a shared link
 * working without re-deriving state.
 *
 * When no query param is present the hook falls back to "most recent session /
 * most recent offer in it", which is what a guest's first pass through the
 * wizard needs — and what a resumed draft or a bookmarked step needs too.
 *
 * "Start something new" is an EXPLICIT intent, never the absence of a param:
 *
 *   - `?offer=new`   → SCR-003 creates a fresh offer ("Add another offer").
 *   - `?session=new` → SCR-002 creates a fresh session ("Start a new evaluation")
 *                      instead of locking onto the candidate's latest one.
 *
 * It used to be the other way round for offers: SCR-003 opted out of inference
 * and treated a missing `?offer=` as "create". But the landing page's "Continue
 * where you left off" link, a hand-typed URL and the browser's back button all
 * reach SCR-003 with no params — each of those showed a blank form for an offer
 * that already existed, and one click of Next attached an empty "Offer B" to
 * the session (QA report B2). Inference is the safe default; creation is opt-in.
 */

type NewOr<T> = T | 'new';

export function useWizardContext() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionParam = parseParam(searchParams.get('session'));
  const offerParam = parseParam(searchParams.get('offer'));

  const startingNewSession = sessionParam === 'new';
  const startingNewOffer = offerParam === 'new';

  const [sessionId, setSessionId] = React.useState<number | null>(
    idOrNull(sessionParam),
  );
  const [offerId, setOfferId] = React.useState<number | null>(
    idOrNull(offerParam),
  );
  const [resolving, setResolving] = React.useState(true);
  // The session's offers as seen while inferring the offer id, so SCR-003 can
  // label a new offer ("Offer B") without fetching the same session again.
  const [sessionOffers, setSessionOffers] = React.useState<api.Offer[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function resolve() {
      let resolvedSessionId = idOrNull(sessionParam);
      let resolvedOfferId = idOrNull(offerParam);

      // A new session has no id until SCR-002 creates it, and must not fall
      // back to the latest one — that is exactly the lock it exists to escape.
      if (!resolvedSessionId && !startingNewSession) {
        const sessions = await api.getEvaluationSessions().catch(() => null);
        resolvedSessionId = sessions?.[0]?.id ?? null;
      }

      // Likewise a new offer stays null so SCR-003 creates rather than edits.
      if (!resolvedOfferId && resolvedSessionId && !startingNewOffer) {
        const session = await api
          .getEvaluationSession(resolvedSessionId)
          .catch(() => null);
        const offers = session?.offers ?? [];
        resolvedOfferId = offers[offers.length - 1]?.id ?? null;
        if (!cancelled && session) setSessionOffers(offers);
      }

      if (cancelled) return;
      setSessionId(resolvedSessionId);
      setOfferId(resolvedOfferId);
      setResolving(false);
    }

    resolve();
    return () => {
      cancelled = true;
    };
    // Re-resolving on every searchParams change would race the navigation calls
    // below — this runs once per mount, which is what a wizard step needs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Push `?session=&offer=` onto a wizard href without dropping either id.
   *
   * Overrides are three-valued on purpose. `'offer' in overrides` distinguishes
   * "not specified" (inherit the current id) from "explicitly set":
   *
   *   - a number    → that id
   *   - `null`      → drop the param (a plain `?? offerId` fallback cannot say this)
   *   - `'new'`     → `?offer=new`, the explicit create intent SCR-003 looks for
   *
   * The `new` intents also carry themselves forward: while the candidate is on
   * the way to creating a session (SCR-001 → SCR-002 with `?session=new`) every
   * hop keeps the marker, otherwise SCR-002 would resolve their latest session
   * and lock. The marker is replaced by a real id the moment one exists.
   */
  const withContext = React.useCallback(
    (
      href: string,
      overrides?: { session?: NewOr<number> | null; offer?: NewOr<number> | null },
    ) => {
      const params = new URLSearchParams();
      const s =
        overrides && 'session' in overrides
          ? overrides.session
          : sessionId ?? (startingNewSession ? 'new' : null);
      const o =
        overrides && 'offer' in overrides
          ? overrides.offer
          : offerId ?? (startingNewOffer ? 'new' : null);
      if (s) params.set('session', String(s));
      if (o) params.set('offer', String(o));
      const qs = params.toString();
      return qs ? `${href}?${qs}` : href;
    },
    [sessionId, offerId, startingNewSession, startingNewOffer],
  );

  const navigateWithContext = React.useCallback(
    (
      href: string,
      overrides?: { session?: NewOr<number> | null; offer?: NewOr<number> | null },
    ) => {
      router.push(withContext(href, overrides));
    },
    [router, withContext],
  );

  return {
    sessionId,
    offerId,
    /** `?session=new` — SCR-002 must create a session rather than lock. */
    startingNewSession,
    /** `?offer=new` — SCR-003 must create an offer rather than edit. */
    startingNewOffer,
    resolving,
    /** Offers on the resolved session, when inference had to load it; else null. */
    sessionOffers,
    withContext,
    navigateWithContext,
  };
}

function parseParam(raw: string | null): NewOr<number> | null {
  if (!raw) return null;
  if (raw === 'new') return 'new';
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function idOrNull(value: NewOr<number> | null): number | null {
  return typeof value === 'number' ? value : null;
}
