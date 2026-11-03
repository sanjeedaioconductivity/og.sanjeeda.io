import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

// Footer surfaces follow the same rules as ModernHeader so the page ends the way
// it starts: brand tokens for the palette (`brand-*` swaps with data-palette),
// `dark:` for the colour mode, and the two cropped logo assets swapped per mode —
// never the padded `sanjeeda logo2.png`, whose empty canvas forced the old
// `-mt-20` hack under the wordmark.
//
// The footer is always a dark brand-ink band (light mode included) so it reads as its
// own surface instead of blending into the off-white pages above it. It therefore
// always uses the white logo and white-on-dark text; dark mode keeps its own colour.
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
      className="relative overflow-hidden bg-brand-ink text-white transition-colors
        dark:bg-darkBlue
        playful-dark:bg-brand-ink"
    >
      {/* Brand hairline — the one element that stays vivid in every mode. */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-blue via-brand-accent to-brand-sky" />
      {/* Faint dot grid, so the band has texture without competing with the content. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 top-1 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "18px 18px" }}
      />

      <div className="relative mx-auto max-w-[1400px] px-5 pb-4 pt-6 sm:px-8 lg:px-12">
        <div className="grid gap-6 border-b border-white/10 pb-5 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <Link href="/" className="inline-block" aria-label="Sanjeeda home">
              <Image
                src="/sanjeeda-logo-dark.png"
                alt="Sanjeeda"
                width={466}
                height={95}
                className="h-8 w-auto"
              />
            </Link>
            <a
              href="https://conductivity.com.pk"
              target="_blank"
              rel="noreferrer"
              className="group mt-2 flex w-fit items-baseline gap-1.5 text-sm text-white/55 transition hover:text-white"
            >
              Powered by
              <span className="font-bold text-white transition group-hover:text-brand-accent-bright">Conductivity</span>
            </a>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
              Get in touch
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-sm leading-6 text-white/75">
              {contact.map(({ icon: Icon, label, href }) => {
                const row = (
                  <>
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/10 text-brand-accent-bright">
                      <Icon size={13} />
                    </span>
                    <span>{label}</span>
                  </>
                );
                return (
                  <li key={label}>
                    {href ? (
                      <a
                        href={href}
                        className="flex items-center gap-2.5 transition hover:text-brand-accent-bright"
                      >
                        {row}
                      </a>
                    ) : (
                      <span className="flex items-center gap-2.5">{row}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-1 pt-3 font-medium text-white/45 sm:flex-row sm:items-center sm:justify-between">
          {/* text-xs sits on each <p>: a global `p` rule would otherwise override an inherited size. */}
          <p className="text-xs">© {new Date().getFullYear()} Sanjeeda.io. All rights reserved.</p>
          <p className="text-xs">Career development for people serious about progress.</p>
        </div>
      </div>
    </footer>
  );
}
