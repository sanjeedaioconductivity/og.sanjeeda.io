/**
 * 3D CVs mark: a red σ on dashed x/y axes with a rising z arrow, above the
 * "3D CVs" wordmark — redrawn from mockup screen 1.
 *
 * Inline SVG stand-in until the official logo file is added to /public. When it
 * is, swap this component's body for an <Image>; every screen renders it through
 * here. The axes use currentColor so they follow light and dark themes.
 */
export default function Logo3D({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        viewBox="0 0 220 140"
        className="h-24 w-auto text-[hsl(var(--cv-primary-ink))] sm:h-28"
        role="img"
        aria-label="3D CVs logo"
      >
        {/* y axis */}
        <line x1="20" y1="128" x2="20" y2="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M16 14 L20 6 L24 14 Z" fill="currentColor" />
        {/* x axis */}
        <line x1="20" y1="128" x2="200" y2="128" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
        {/* sigma: bowl + top bar */}
        <circle cx="95" cy="80" r="38" fill="none" stroke="#C00000" strokeWidth="24" />
        <rect x="95" y="30" width="78" height="22" fill="#C00000" />
        {/* z arrow, drawn over the sigma */}
        <line x1="20" y1="128" x2="196" y2="18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d="M188 16 L204 12 L196 26 Z" fill="currentColor" />
      </svg>
      <span className="-mt-1 text-3xl font-extrabold tracking-tight">3D CVs</span>
    </div>
  );
}
