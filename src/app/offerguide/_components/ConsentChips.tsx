'use client';

import * as React from 'react';
import { Lock } from 'lucide-react';
import HelpIcon from '@/components/shared/HelpIcon';
import type { ConsentToggle } from '../_state/api';
import { useT } from '../_i18n/LocaleProvider';

/**
 * SCR-009's interactive community-consent controls.
 *
 * Chip styling per that FRS §10: "Master consent toggle — Full-width chip at top
 * of consent section. Green when active. Controls all sub-toggles. Sub-consent
 * toggles — Smaller chips below master toggle. Dimmed when master toggle is
 * Off."
 *
 * TWO EDITORS, ONE STORED VALUE. SCR-001's row-style ConsentCard is also live,
 * so consent can be set from either screen. That is only safe because both write
 * through `PATCH /candidate-profile/consent` and the value lives on the
 * candidate profile, not the session — there is exactly one stored copy, and
 * editing here then opening SCR-001 shows the change (and vice versa).
 *
 * Divergence, not duplication, is what the Sprint 7 handoff's "no second
 * editable copy" was protecting against, and sharing the endpoint is what
 * prevents it. Verified: set on SCR-009 → submit SCR-001 → both toggles and
 * `shareAnonymous` came back unchanged. If a third consent surface is ever
 * added, it must use this same endpoint rather than holding its own state.
 *
 * Master Off means every sub-toggle is disregarded regardless of its stored
 * value (FRS §7). The stored sub-values are deliberately NOT cleared when the
 * master goes off — turning it back on restores the candidate's previous
 * choices instead of silently resetting them.
 */

const MASTER_HELP =
  'Toggle on to help improve market intelligence for all candidates. Your data is fully anonymised before contributing — no personal information is ever shared. You can change this at any time.';

export default function ConsentChips({
  toggles,
  shareAnonymous,
  selections,
  onShareAnonymousChange,
  onSelectionChange,
  saving = false,
  heading,
  privacyNote,
}: {
  toggles: ConsentToggle[];
  shareAnonymous: boolean;
  selections: Record<string, boolean>;
  onShareAnonymousChange: (value: boolean) => void;
  onSelectionChange: (toggleId: string, value: boolean) => void;
  saving?: boolean;
  heading: string;
  privacyNote: string;
}) {
  // `translate`, not `t` — the filters below bind `t` as the toggle variable.
  const translate = useT();

  const master = toggles.find((t) => t.isMaster);
  const subToggles = toggles.filter((t) => !t.isMaster);

  if (toggles.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 dir="auto" className="flex items-center text-xs font-semibold">
        {translate(heading)}
        <HelpIcon text={translate(MASTER_HELP)} label={heading} />
        {saving && (
          <span className="ml-2 text-[11px] font-normal text-muted-foreground">
            {translate('Saving…')}
          </span>
        )}
      </h3>

      {/* Master — full-width chip, green when active. */}
      {master && (
        <button
          type="button"
          role="switch"
          aria-checked={shareAnonymous}
          onClick={() => onShareAnonymousChange(!shareAnonymous)}
          className={[
            'mt-2 flex w-full items-center gap-2.5 rounded-full border px-3 py-2 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            shareAnonymous
              ? 'border-success bg-success-subtle text-success'
              : 'border-border text-muted-foreground hover:bg-muted',
          ].join(' ')}
        >
          <Track on={shareAnonymous} />
          {translate(master.label)}
        </button>
      )}

      {/* Sub-toggles — smaller chips, dimmed while the master is off. */}
      {subToggles.length > 0 && (
        <div
          className={[
            'mt-2 flex flex-wrap gap-2 transition-opacity',
            shareAnonymous ? '' : 'opacity-45',
          ].join(' ')}
        >
          {subToggles.map((t) => {
            const on = shareAnonymous && (selections[t.toggleId] ?? false);
            return (
              <button
                key={t.toggleId}
                type="button"
                role="switch"
                aria-checked={on}
                disabled={!shareAnonymous}
                onClick={() =>
                  onSelectionChange(t.toggleId, !(selections[t.toggleId] ?? false))
                }
                className={[
                  'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  on
                    ? 'border-success/50 text-success'
                    : 'border-border text-muted-foreground',
                  shareAnonymous ? 'hover:bg-muted' : 'cursor-not-allowed',
                ].join(' ')}
              >
                <Track on={on} />
                {translate(t.label)}
              </button>
            );
          })}
        </div>
      )}

      {!shareAnonymous && (
        <p dir="auto" className="mt-1.5 text-[11px] text-muted-foreground">
          {translate('Sharing is off, so nothing is contributed to the community.')}
        </p>
      )}

      <p className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span dir="auto">{translate(privacyNote)}</span>
      </p>
    </div>
  );
}

/**
 * The small switch rendered inside each chip.
 *
 * Always `--success` when on, master and sub alike — that FRS §10 asks for green
 * on the master and the two controls need one shared "on" language. Deliberately
 * NOT `--primary`: in the light theme that token is near-black, so an active
 * sub-toggle read as a dead grey blob rather than an enabled control.
 */
function Track({ on }: { on: boolean }) {
  return (
    <span
      className={[
        'relative h-4 w-7 shrink-0 rounded-full transition-colors',
        on ? 'bg-success' : 'bg-muted-foreground/30',
      ].join(' ')}
      aria-hidden="true"
    >
      {/*
        `left-0.5` is required, not cosmetic. Without an explicit inset the knob
        falls back to its static position, which resolved differently for the
        full-width master chip than for the inline sub-chips — the knob escaped
        the track and covered the first letter of the label. Anchoring left and
        travelling exactly w-7 − w-3 − 2×0.5 = 12px keeps it inside either way.
      */}
      <span
        className={[
          'absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-background shadow transition-transform',
          on ? 'translate-x-3' : 'translate-x-0',
        ].join(' ')}
      />
    </span>
  );
}
