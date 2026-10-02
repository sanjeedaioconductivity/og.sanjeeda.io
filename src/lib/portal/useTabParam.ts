"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Dashboard tab state that survives a browser refresh.
 *
 * On mount the tab is restored from `?tab=` (falling back to localStorage), so a
 * hard refresh returns to the tab the user was on. On change it is written back
 * to both the URL (via `history.replaceState`, so no navigation) and
 * localStorage.
 *
 * The third return value, `hydrated`, is `false` until the client has read the
 * stored tab. Render a neutral placeholder for the tab body while it is false so
 * a refresh never flashes the default tab's content, and so server and client
 * agree on the first render (no hydration mismatch).
 */
export function useTabParam<T extends string>(
  storageKey: string,
  allowed: readonly T[],
  fallback: T
): [T, (value: T) => void, boolean] {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("tab");
      const fromStore = window.localStorage.getItem(storageKey);
      const wanted = (fromUrl || fromStore || "") as T;
      if (allowed.includes(wanted)) setValue(wanted);
    } catch {
      /* ignore */
    }
    setHydrated(true);
    // `allowed` / `fallback` are module-level constants at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(storageKey, next);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", next);
        window.history.replaceState(null, "", url.toString());
      } catch {
        /* ignore */
      }
    },
    [storageKey]
  );

  return [value, set, hydrated];
}
