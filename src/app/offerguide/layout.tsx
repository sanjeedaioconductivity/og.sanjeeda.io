import type { Metadata } from 'next';
import { LocaleProvider } from './_i18n/LocaleProvider';

/**
 * OfferGuide module shell.
 *
 * Exists for one structural reason: `globals.css` paints a hardcoded
 * `body { background-color: #efefef }` for the whole portal and only overrides it
 * under `.dark`. OfferGuide's default is light and it must be built entirely on
 * theme tokens (Sprint 6 handoff §2), so the module paints its own token-driven
 * surface here rather than inheriting the legacy grey. The global `body` rule is
 * deliberately left alone — changing it would restyle every existing page.
 *
 * The LocaleProvider is scoped HERE rather than in the root layout: it sets
 * `dir="rtl"` for right-to-left languages, and applying that portal-wide would
 * flip every existing page that was never built for it. OfferGuide owns its own
 * language choice, which is also why the switcher lives in WizardShell.
 *
 * This is layout only. No auth gate, no permission check, no role logic: OfferGuide
 * is public and a guest completes the entire wizard with no account.
 */

export const metadata: Metadata = {
  title: 'OfferGuide | Sanjeeda',
  description:
    'Understand how well a job offer fits your needs before you say yes. Scored across seven things that shape your life.',
};

/**
 * OfferGuide's dark palette, scoped to this module.
 *
 * The portal-wide `.dark` block in `globals.css` sets `--background` to the mid
 * blue `#1f5690`, which reads as washed-out over a long form. These arbitrary-property
 * utilities re-point the same shadcn tokens on this wrapper only, so every OfferGuide
 * surface — `bg-card`, `bg-muted`, `border-border` — follows automatically without
 * touching a single component, and no other page in the portal changes.
 *
 * `--background` is a lighter, bluish slate (hue 230, matching the ramp below) rather
 * than a near-black navy — the near-black original read as "just black" instead of a
 * tinted dark surface. Keep this in sync with `.dark:has(.og-surface) body` in
 * globals.css, which paints the same colour on <body> as a fallback for the moment
 * before `.og-surface` covers the viewport (QA report A5) — a mismatch there shows up
 * as a visible band. The rest of the ramp lightens in the same hue to keep surfaces
 * layered: background → card → muted → border.
 *
 * These MUST stay whole literal strings. Tailwind scans source text for class names, so
 * a value built by concatenation at runtime never gets a rule generated for it.
 *
 * NOTE: `--primary` is deliberately left on the portal value. It fills buttons that pair
 * it with white `--primary-foreground`, and lightening it for text contrast would drag
 * those buttons below the threshold instead. See the contrast note in the Sprint 9 doc.
 */
const OFFERGUIDE_DARK_SURFACE = [
  // Page + body copy
  'dark:[--background:230_35%_18%]',
  'dark:[--foreground:0_0%_100%]',
  // Raised surfaces: cards, panels, popovers
  'dark:[--card:230_30%_30%]',
  'dark:[--card-foreground:0_0%_100%]',
  'dark:[--popover:230_28%_24%]',
  'dark:[--popover-foreground:0_0%_100%]',
  // Recessed surfaces: inputs, chips, unselected radio cards
  'dark:[--muted:230_22%_30%]',
  'dark:[--muted-foreground:214_25%_80%]',
  'dark:[--secondary:230_20%_32%]',
  'dark:[--secondary-foreground:0_0%_100%]',
  // Hairlines
  'dark:[--border:230_22%_50%]',
  'dark:[--input:230_22%_50%]',
].join(' ');

export default function OfferGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      // `og-surface` is a hook for globals.css: the Playful palette recolours the
      // dark-mode text tokens for this surface, and needs a selector that beats
      // the `dark:[--foreground:…]` classes above — those live on this element,
      // so a value set on <html> alone cannot win the cascade here.
      className={`og-surface min-h-screen bg-background text-foreground ${OFFERGUIDE_DARK_SURFACE}`}
    >
      <LocaleProvider>{children}</LocaleProvider>
    </div>
  );
}
