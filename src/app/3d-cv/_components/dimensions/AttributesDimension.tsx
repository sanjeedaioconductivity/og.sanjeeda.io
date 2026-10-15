'use client';

import { cn } from '@/lib/utils';
import { SelectInput } from '../ui';
import DimensionFrame from './DimensionFrame';
import {
  ATTRIBUTE_RATINGS,
  ATTRIBUTE_SOURCES,
  ATTRIBUTE_TARGET,
  ATTRIBUTES,
  RATING_DOTS,
  type AttributeRating,
} from '../../_lib/entries';
import { useCv3d } from '../../_lib/store';

/**
 * Screen 14 — Attribute Fitness. One rating per attribute (Low / Medium / High,
 * the spec's scale) plus where that rating comes from. The dots are a picture of
 * the rating, not a second input.
 */
export default function AttributesDimension() {
  const { state, setAttribute } = useCv3d();
  const rated = ATTRIBUTES.filter((a) => state.attributes[a].rating).length;

  return (
    <DimensionFrame
      dimension="attributes"
      heading="Attribute Fitness"
      subtitle="Tell us about your work style, strengths and professional attributes."
    >
      <p className="mb-3 text-xs text-muted-foreground">
        Rate at least {ATTRIBUTE_TARGET} ({rated} rated). Ratings backed by a mentor, employer, project or test count more
        than self-reflection, and only backed attributes are used as claims in your CV.
      </p>

      <ul className="space-y-2">
        {ATTRIBUTES.map((name) => {
          const value = state.attributes[name];
          const dots = value.rating ? RATING_DOTS[value.rating] : 0;
          const id = `attr-${name.replace(/\W+/g, '-').toLowerCase()}`;
          return (
            <li key={name} className="rounded-xl border border-border bg-card px-3 py-2.5">
              <div className="flex items-center gap-3">
                <label htmlFor={id} className="min-w-0 flex-1 text-sm font-medium">
                  {name}
                </label>
                <span className="flex gap-1" aria-hidden>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <span
                      key={d}
                      className={cn('h-2.5 w-2.5 rounded-full', d <= dots ? 'bg-emerald-500' : 'bg-muted-foreground/25')}
                    />
                  ))}
                </span>
                <SelectInput
                  id={id}
                  value={value.rating}
                  onChange={(e) =>
                    setAttribute(name, {
                      rating: e.target.value as AttributeRating | '',
                      source: value.source || 'Self-reflection',
                    })
                  }
                  className="w-28 py-1.5 text-xs"
                >
                  <option value="">Rate…</option>
                  {ATTRIBUTE_RATINGS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </SelectInput>
              </div>
              {value.rating && (
                <div className="mt-2 flex items-center gap-2 pl-0.5">
                  <label htmlFor={`${id}-src`} className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                    Based on
                  </label>
                  <SelectInput
                    id={`${id}-src`}
                    value={value.source}
                    onChange={(e) => setAttribute(name, { source: e.target.value })}
                    className="py-1 text-xs"
                  >
                    {ATTRIBUTE_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </SelectInput>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </DimensionFrame>
  );
}
