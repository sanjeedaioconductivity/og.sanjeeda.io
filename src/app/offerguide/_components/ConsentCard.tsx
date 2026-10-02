'use client';

import * as React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { ConsentToggle } from '../_state/api';
import { useT } from '../_i18n/LocaleProvider';

/**
 * Consent card — bottom of SCR-001, above the bottom nav.
 *
 * Consent is CANDIDATE-level, not session-level: captured once here and applied to
 * every future evaluation. It moved to SCR-001 from SCR-009; the model itself is
 * unchanged and its six field definitions still live in the SCR-009 FRS §7.
 *
 * The toggle set is driven entirely by `/config/consent-toggles`, backed by the
 * OgConsentToggles collection — one master plus its sub-toggles. Nothing here is
 * hardcoded, so retiring or adding a consent category is a config edit, not a
 * release. That is a DoD requirement, and it is also why this component renders
 * whatever the endpoint returns rather than a fixed list of five.
 *
 * Everything defaults OFF. Privacy-first: the candidate opts in actively, and an
 * untouched card shares nothing.
 *
 * The anonymisation copy below is FRS wording, reproduced unchanged by explicit
 * instruction — contributions are anonymised patterns, never personal identities.
 */

const ANONYMISATION_NOTE =
  'Anything you choose to share is contributed as anonymised patterns only — never as your personal identity. Your answers stay private, and no employer sees them.';

export default function ConsentCard({
  toggles,
  shareAnonymous,
  selections,
  onShareAnonymousChange,
  onSelectionChange,
  loading = false,
}: {
  toggles: ConsentToggle[];
  shareAnonymous: boolean;
  selections: Record<string, boolean>;
  onShareAnonymousChange: (value: boolean) => void;
  onSelectionChange: (toggleId: string, value: boolean) => void;
  loading?: boolean;
}) {
  // `translate`, not `t` — the toggle callbacks below already bind `t` as the
  // loop variable, and shadowing it here would silently translate nothing.
  const translate = useT();

  const master = toggles.find((t) => t.isMaster);
  const subToggles = toggles.filter((t) => !t.isMaster);

  if (loading) {
    return (
      <section className="mt-10 rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Loading consent options…</p>
      </section>
    );
  }

  if (toggles.length === 0) return null;

  return (
    <section className="mt-5 rounded-lg border border-border bg-card p-4">
      <h2 dir="auto" className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
        {translate('Sharing & privacy')}
      </h2>

      {/* Master toggle. When off, the sub-toggles below are dimmed and their
          stored values are disregarded — see the note on the sub-toggle list. */}
      {master && (
        <div className="mt-3 rounded-lg border border-border p-3">
          <ConsentRow
            id={master.toggleId}
            label={master.label}
            helpText={master.helpText}
            checked={shareAnonymous}
            onChange={onShareAnonymousChange}
          />
        </div>
      )}

      {subToggles.length > 0 && (
        <div
          className={[
            'mt-3 space-y-2.5 rounded-lg border border-border p-3 transition-opacity',
            shareAnonymous ? '' : 'pointer-events-none opacity-45',
          ].join(' ')}
          aria-disabled={!shareAnonymous || undefined}
        >
          {!shareAnonymous && (
            <p dir="auto" className="text-xs text-muted-foreground">
              {translate('Turn on sharing to choose what you contribute.')}
            </p>
          )}
          {subToggles.map((toggle) => (
            <ConsentRow
              key={toggle.toggleId}
              id={toggle.toggleId}
              label={toggle.label}
              helpText={toggle.helpText}
              checked={selections[toggle.toggleId] ?? false}
              onChange={(value) => onSelectionChange(toggle.toggleId, value)}
              disabled={!shareAnonymous}
            />
          ))}
        </div>
      )}

      <p dir="auto" className="mt-3 text-[11px] leading-snug text-muted-foreground">
        {translate(ANONYMISATION_NOTE)}
      </p>
    </section>
  );
}

function ConsentRow({
  id,
  label,
  helpText,
  checked,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  helpText?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const translate = useT();

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label
          htmlFor={`consent-${id}`}
          dir="auto"
          className="text-xs font-medium"
        >
          {translate(label)}
        </label>
        {helpText && (
          <p
            dir="auto"
            className="mt-0.5 text-[11px] leading-snug text-muted-foreground"
          >
            {translate(helpText)}
          </p>
        )}
      </div>
      <button
        id={`consent-${id}`}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          checked ? 'bg-primary' : 'bg-muted',
          disabled ? 'cursor-not-allowed' : '',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          ].join(' ')}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
