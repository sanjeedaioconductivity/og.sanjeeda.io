'use client';

/**
 * ThemeToggle — small control that cycles light → dark → system.
 * Portal-wide (OfferGuide Sprint 2, Epic 2.1). Built on the shared Button
 * primitive and the ThemeProvider context.
 *
 * Borderless (`ghost`) with lucide icons, so it sits as a plain icon beside
 * the palette picker — the two read as one quiet cluster rather than a row of
 * boxed buttons. The icon shows the CURRENT setting; the label says what it is.
 */

import * as React from 'react';
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme, type Theme } from '@/components/theme-provider';

const ORDER: Theme[] = ['light', 'dark', 'system'];
const ICON: Record<Theme, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = ICON[theme];

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      aria-label={`Theme: ${theme}. Click to change.`}
      title={`Theme: ${theme}`}
      className="rounded-full text-brand-ink hover:bg-brand-ink/5 playful:hover:bg-brand-accent-soft dark:text-white dark:hover:bg-white/10"
    >
      <Icon size={18} />
    </Button>
  );
}
