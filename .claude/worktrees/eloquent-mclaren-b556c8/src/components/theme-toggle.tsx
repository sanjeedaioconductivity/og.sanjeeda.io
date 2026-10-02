'use client';

/**
 * ThemeToggle — small control that cycles light → dark → system.
 * Portal-wide (OfferGuide Sprint 2, Epic 2.1). Built on the shared Button
 * primitive and the ThemeProvider context.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme, type Theme } from '@/components/theme-provider';

const ORDER: Theme[] = ['light', 'dark', 'system'];
const ICON: Record<Theme, string> = {
  light: '☀️',
  dark: '🌙',
  system: '🖥️',
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycle}
      aria-label={`Theme: ${theme}. Click to change.`}
      title={`Theme: ${theme}`}
    >
      {ICON[theme]}
    </Button>
  );
}
