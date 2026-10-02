import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

// Footer surfaces follow the same rules as ModernHeader so the page ends the way
// it starts: brand tokens for the palette (`brand-*` swaps with data-palette),
// `dark:` for the colour mode, and the two cropped logo assets swapped per mode —
// never the padded `sanjeeda logo2.png`, whose empty canvas forced the old
// `-mt-20` hack under the wordmark.
const contact = [
  {
    icon: MapPin,
    label: "B-65, Block 2, Gulshan-e-Iqbal, Karachi, Pakistan",
    href: undefined,
  },
  { icon: Phone, label: "+92 21 34832777", href: "tel:+922134832777" },
  {
    icon: Mail,
    label: "info@conductivity.com.pk",
    href: "mailto:info@conductivity.com.pk",
  },
];

export default function ModernFooter() {
  return (
    <footer
      className="relative border-t border-brand-ink/10 bg-brand-paper text-brand-ink transition-colors
        playful:border-brand-accent/15
        dark:border-white/10 dark:bg-darkBlue dark:text-white
        playful-dark:bg-brand-ink"
    >
      {/* Brand hairline — the one element that stays vivid in every mode. */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-blue via-brand-accent to-brand-sky" />

      <div className="mx-auto max-w-[1400px] px-5 pb-8 pt-12 sm:px-8 lg:px-12 lg:pt-14">
        <div className="grid gap-10 border-b border-brand-ink/10 pb-10 dark:border-white/10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Link href="/" className="inline-block" aria-label="Sanjeeda home">
              <Image
                src="/sanjeeda-logo-light.png"
                alt="Sanjeeda"
                width={621}
                height={129}
                className="h-10 w-auto dark:hidden"
              />
              <Image
                src="/sanjeeda-logo-dark.png"
                alt="Sanjeeda"
                width={466}
                height={95}
                className="hidden h-10 w-auto dark:block"
              />
            </Link>
            <p className="mt-5 max-w-md text-sm leading-6 text-brand-ink/65 dark:text-white/65">
              Smart career tools and human guidance for people serious about
              understanding themselves, building their edge and choosing better.
            </p>
            <a
              href="https://conductivity.com.pk"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-3 rounded-full border border-brand-ink/10 bg-white/60 px-4 py-2 transition hover:border-brand-accent/40
                dark:border-white/15 dark:bg-white/5 dark:hover:border-brand-accent-bright/50"
            >
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-ink/50 dark:text-white/45">
                Powered by
              </span>
              <Image
                src="/conductivitylogo.png"
                alt="Conductivity"
                width={1000}
                height={220}
                className="h-auto w-24 dark:brightness-0 dark:invert"
              />
            </a>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-brand-ink/50 dark:text-white/45">
              Get in touch
            </h3>
            <ul className="mt-4 space-y-3.5 text-sm leading-6 text-brand-ink/75 dark:text-white/70">
              {contact.map(({ icon: Icon, label, href }) => {
                const row = (
                  <>
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-accent-soft text-brand-accent dark:bg-white/10 dark:text-brand-accent-bright">
                      <Icon size={16} />
                    </span>
                    <span className="pt-1">{label}</span>
                  </>
                );
                return (
                  <li key={label}>
                    {href ? (
                      <a
                        href={href}
                        className="flex gap-3 transition hover:text-brand-accent dark:hover:text-brand-accent-bright"
                      >
                        {row}
                      </a>
                    ) : (
                      <span className="flex gap-3">{row}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-6 text-xs font-medium text-brand-ink/50 dark:text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Sanjeeda.io. All rights reserved.</p>
          <p>Career development for people serious about progress.</p>
        </div>
      </div>
    </footer>
  );
}
