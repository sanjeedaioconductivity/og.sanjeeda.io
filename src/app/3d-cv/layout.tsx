import type { Metadata } from 'next';
import { Cv3dProvider } from './_lib/store';

/**
 * 3D CVs module shell.
 *
 * Same pattern as offerguide/layout.tsx: the module paints its own token-driven
 * surface on a wrapper instead of inheriting the portal's legacy #efefef / mid-blue,
 * and re-points the shadcn tokens here so every `bg-card` / `border-border` inside
 * follows without touching a component.
 *
 * Dark values are deliberately IDENTICAL to OfferGuide's, so the header's night
 * strip (NIGHT_SURFACE_ROUTES in ModernHeader) and the canvas fallback in
 * globals.css (`.dark:has(.cv3d-surface) body`) match without a second palette.
 * Keep the --background triples in sync with that globals.css rule.
 *
 * The `--cv-*` tokens are the module's own brand colours from the mockups:
 * purple for primary actions and selection, Sanjeeda red for the main
 * "Save and Continue"-style call to action. `-ink` is the text-safe variant.
 *
 * Whole literal strings only: Tailwind scans source text for class names.
 */

export const metadata: Metadata = {
  title: '3D CVs | Sanjeeda',
  description:
    'One verified profile. Multiple job-specific CVs. Better chances of selection.',
};

const CV3D_TOKENS = [
  // Light
  '[--background:240_33%_98%]',
  '[--card:0_0%_100%]',
  '[--muted:240_20%_96%]',
  '[--muted-foreground:230_12%_42%]',
  '[--border:235_20%_90%]',
  '[--input:235_20%_86%]',
  '[--foreground:234_45%_12%]',
  '[--cv-primary:251_67%_55%]',
  '[--cv-primary-soft:250_100%_97%]',
  '[--cv-primary-ink:251_60%_48%]',
  '[--cv-cta:0_100%_38%]',
  // Dark
  'dark:[--background:230_35%_18%]',
  'dark:[--foreground:0_0%_100%]',
  'dark:[--card:230_30%_24%]',
  'dark:[--card-foreground:0_0%_100%]',
  'dark:[--popover:230_28%_24%]',
  'dark:[--popover-foreground:0_0%_100%]',
  'dark:[--muted:230_22%_30%]',
  'dark:[--muted-foreground:214_25%_80%]',
  'dark:[--border:230_22%_38%]',
  'dark:[--input:230_22%_50%]',
  'dark:[--cv-primary:251_60%_58%]',
  'dark:[--cv-primary-soft:251_35%_30%]',
  'dark:[--cv-primary-ink:251_95%_84%]',
  'dark:[--cv-cta:0_85%_45%]',
].join(' ');

export default function Cv3dLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`cv3d-surface min-h-screen bg-background text-foreground ${CV3D_TOKENS}`}>
      <Cv3dProvider>{children}</Cv3dProvider>
    </div>
  );
}
