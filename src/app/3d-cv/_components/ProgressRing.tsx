import { MIN_COMPLETION_FOR_CV } from '../_lib/dimensions';

/** The "46% Profile Complete" donut from mockup screens 5 and 7. */
export default function ProgressRing({
  percent,
  label = 'Profile Complete',
  note,
}: {
  percent: number;
  label?: string;
  /** Replaces the 60%-lock line under the ring. */
  note?: string;
}) {
  const size = 128;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference * (1 - clamped / 100);
  const unlocked = clamped >= MIN_COMPLETION_FOR_CV;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative"
        style={{ width: size, height: size }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="stroke-[hsl(var(--cv-primary))] transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{clamped}%</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {note ??
          (unlocked
          ? 'Your profile is strong enough to generate a CV.'
          : `Complete at least ${MIN_COMPLETION_FOR_CV}% to generate your first CV.`)}
      </p>
    </div>
  );
}
