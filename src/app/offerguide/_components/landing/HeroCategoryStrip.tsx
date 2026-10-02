import {
  Banknote,
  Flag,
  HeartHandshake,
  Scale,
  ShieldCheck,
  Target,
  ThumbsUp,
  TrendingUp,
  Users,
} from 'lucide-react';
import { LANDING_HERO } from '../../_constants/landingCopy';

/**
 * The hero sub-headline, decorated with an icon for each of the seven scored
 * categories plus the two outcomes it promises ("strong" / "push back").
 *
 * `LANDING_HERO.subHeadline` is FRS-verbatim (see landingCopy.ts's file header —
 * "do not reword, re-punctuate, or improve") and this never touches that string.
 * It stays, whole, as an `sr-only` node so screen readers and search indexing
 * still get the exact approved sentence. Everything visible below it is a
 * purely decorative, `aria-hidden` restatement of the SAME words in the SAME
 * order — the seven comma-separated nouns become a row of icon chips instead
 * of a run-on list, and the two outcomes at the end get one icon each. Nothing
 * is reworded; only the layout changes.
 */
const CATEGORIES = [
  { label: 'Salary', icon: Banknote },
  { label: 'Benefits', icon: HeartHandshake },
  { label: 'Stability', icon: ShieldCheck },
  { label: 'Work-life', icon: Scale },
  { label: 'Growth', icon: TrendingUp },
  { label: 'Culture', icon: Users },
  { label: 'Purpose', icon: Target },
] as const;

export default function HeroCategoryStrip() {
  return (
    <div className="mt-4 max-w-4xl">
      {/* The one place the approved copy is actually read by anything other
          than a sighted eye. */}
      <span className="sr-only">{LANDING_HERO.subHeadline}</span>

    
    </div>
  );
}
