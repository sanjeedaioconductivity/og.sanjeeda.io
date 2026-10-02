'use client';

import * as React from 'react';
import {
  DEFAULT_COMPARE_MODE,
  isCompareMode,
  type CompareMode,
} from '../_constants/compareMode';

/**
 * Which compare mode the wizard is walking in — CR-02 / CR-05.
 *
 * ================ WHY sessionStorage AND NOT THE OTHER THREE OPTIONS ================
 *
 *   the database    the mode picks which screens to show. It is not an answer
 *                   about the offer, nothing is scored from it, no report prints
 *                   it, and two candidates with identical answers must get
 *                   identical scores whichever path they walked. A column would
 *                   put a UI preference in the evaluation record for good.
 *   a query param   it would have to be added to every `navigateWithContext`
 *                   call and to `withContext`'s override shape to survive a hop,
 *                   and a shared or bookmarked link would then carry someone
 *                   else's choice of path.
 *   localStorage    it would outlive the evaluation. Coming back next month to
 *                   look at a second offer should start from the default, not
 *                   from a shortcut chosen once.
 *
 * sessionStorage is exactly the right lifetime: the browser tab, which is also
 * the life of one pass through the wizard. It survives a reload and the back
 * button, and it is gone when the tab closes.
 *
 * ALL READS AND WRITES ARE GUARDED. sessionStorage throws in a private window
 * with site data blocked, and is simply absent during the server render. Every
 * failure degrades to `full`, the default and the pre-CR behaviour — never to an
 * exception, and never to a candidate silently placed on a shorter path.
 *
 * `null` while the first read is still pending, so a caller can hold off rather
 * than render the full-mode chrome for a frame and then swap it.
 */

const STORAGE_KEY = 'og.compareMode';

/** Same-tab notification — a `storage` event only fires in OTHER tabs. */
const CHANGE_EVENT = 'og:compare-mode';

function readStoredMode(): CompareMode {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return isCompareMode(raw) ? raw : DEFAULT_COMPARE_MODE;
  } catch {
    return DEFAULT_COMPARE_MODE;
  }
}

export function useCompareMode(): {
  /** Null until the first read lands; treat as `full` if you cannot wait. */
  mode: CompareMode | null;
  /** Resolved mode — `full` while still loading. For anything that must decide now. */
  resolvedMode: CompareMode;
  setMode: (mode: CompareMode) => void;
  isQuick: boolean;
} {
  const [mode, setModeState] = React.useState<CompareMode | null>(null);

  React.useEffect(() => {
    setModeState(readStoredMode());

    // Keeps two mounted consumers — the shell's chrome and the profile screen's
    // picker — from disagreeing after one of them writes.
    const sync = () => setModeState(readStoredMode());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setMode = React.useCallback((next: CompareMode) => {
    // State first: the picker must respond even where storage is unavailable.
    setModeState(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private window with site data blocked. The choice holds for this page.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const resolvedMode = mode ?? DEFAULT_COMPARE_MODE;

  return { mode, resolvedMode, setMode, isQuick: resolvedMode === 'quick' };
}
