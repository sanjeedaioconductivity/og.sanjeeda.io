'use client';

/**
 * ThemeProvider — portal-wide theme system (OfferGuide Sprint 2, Epic 2.1).
 *
 * Supports three states: 'light' | 'dark' | 'system'. 'system' follows the OS
 * via `prefers-color-scheme`. Toggling updates the `dark` class on <html>,
 * building on `darkMode: 'class'` (already enabled in tailwind.config.ts).
 *
 * Persistence: a single, clearly-named, theme-only storage key
 * (`portal-theme`). Per NAMING_CONVENTIONS.md §10 this is NOT auth/session
 * state, so a dedicated theme key is fine — it must not become a second place
 * session-like state is stored. To avoid a flash of the wrong theme before
 * hydration, pair this with the inline <script> in app/layout.tsx that applies
 * the same key on first paint (they must stay in sync).
 */

import * as React from 'react';

export const THEME_STORAGE_KEY = 'portal-theme';

export type Theme = 'light' | 'dark' | 'system';

type ThemeProviderState = {
  /** The user's chosen setting: light | dark | system. */
  theme: Theme;
  /** The actually-applied theme after resolving 'system'. */
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = React.createContext<ThemeProviderState | undefined>(
  undefined,
);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyThemeClass(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = THEME_STORAGE_KEY,
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>(
    'light',
  );

  // Read the persisted choice once on mount (client only).
  React.useEffect(() => {
    let stored: Theme | null = null;
    try {
      stored = localStorage.getItem(storageKey) as Theme | null;
    } catch {
      /* storage may be unavailable (private mode) — fall back to default */
    }
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setThemeState(stored);
    }
  }, [storageKey]);

  // Apply the theme to <html> whenever the choice changes, and keep 'system'
  // in sync with live OS changes.
  React.useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(resolved);
    applyThemeClass(resolved);

    if (theme !== 'system') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next = getSystemTheme();
      setResolvedTheme(next);
      applyThemeClass(next);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = React.useCallback(
    (next: Theme) => {
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        /* ignore persistence failures */
      }
      setThemeState(next);
    },
    [storageKey],
  );

  const value = React.useMemo<ThemeProviderState>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme(): ThemeProviderState {
  const context = React.useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
