import { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  // `!./src/generated/**` is not optional. That directory holds the generated
  // Prisma client — thousands of files with no class names in them. Scanning it
  // is pure waste, and worse: `prisma generate` rewrites the directory, which
  // invalidates Tailwind's cached file list mid-session. Its content watcher
  // then statSync()s a path that no longer exists and throws
  //   ENOENT: no such file or directory, stat '…/src/generated/prisma/internal/class.ts'
  // out of globals.css — which surfaces as every page 500ing until the dev
  // server is restarted. Regenerating the client should not take the site down.
  content: [
    './public/**/*.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '!./src/generated/**',
  ],

  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },

    extend: {
      colors: {
        // Palette-aware brand tokens. Each resolves to a CSS variable that the
        // header's palette picker swaps (see the Palettes block in globals.css),
        // so `text-brand-ink` follows whichever palette the visitor chose.
        // `<alpha-value>` keeps `/10`-style opacity modifiers working.
        brand: {
          ink: 'rgb(var(--brand-ink) / <alpha-value>)',
          accent: 'rgb(var(--brand-accent) / <alpha-value>)',
          'accent-soft': 'rgb(var(--brand-accent-soft) / <alpha-value>)',
          'accent-bright': 'rgb(var(--brand-accent-bright) / <alpha-value>)',
          blue: 'rgb(var(--brand-blue) / <alpha-value>)',
          'blue-soft': 'rgb(var(--brand-blue-soft) / <alpha-value>)',
          'blue-bright': 'rgb(var(--brand-blue-bright) / <alpha-value>)',
          sky: 'rgb(var(--brand-sky) / <alpha-value>)',
          paper: 'rgb(var(--brand-paper) / <alpha-value>)',
        },

        // 🔵 Brand Colors
        customBlue: '#00838F',
        darkBlue: '#1f5690',
        // Dark-mode surface for OfferGuide + Khudi. Matches the footer hex so the
        // header, page and footer meet without a seam. Deliberately NOT a change to
        // `darkBlue`, which ~15 other pages still read.
        nightBlue: '#060c29',
        TealBlue: '#004D60',
        Blue: '#2E3192',
        Red: '#C00000',

        // ⚪ Neutrals
        white: '#ffffff',
        whitesmoke: '#f5f5f5',
        black: '#000000',
        gray: '#808080',
        gray2: '#ccc4c4ad',

        // 💎 Accent Colors
        pink: '#cc3e8c',
        purple: '#ca1ccae3',
        green1: '#00ab41',
        darkgreen: '#008631',

        // 🎨 Shades (structured for gradients, bars, hover effects)
        blue: {
          100: '#DBEAFE',
          600: '#2563EB',
        },
        green: {
          100: '#D1FAE5',
          600: '#059669',
        },
        yellow: {
          100: '#FEF9C3',
          600: '#CA8A04',
        },
        purpleShades: {
          100: '#F3E8FF',
          600: '#7C3AED',
        },
        orange: {
          100: '#FFEDD5',
          600: '#EA580C',
        },
        pinkShades: {
          100: '#FCE7F3',
          600: '#DB2777',
        },
        teal: {
          100: '#CCFBF1',
          600: '#0D9488',
        },

        // 🖤 UI Gradients
        gradientStart: '#2E3192',
        gradientEnd: '#00ab41',

        // 🧩 shadcn/ui semantic tokens (HSL CSS variables, defined in globals.css)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        // Semantic signal tokens. Defined in globals.css since Sprint 2 but never
        // mapped here, so `bg-warning` / `text-warning` didn't resolve. SCR-005
        // needs amber on "Risky" (job security) and "Yes" (restrictive clause);
        // without this mapping that becomes a hardcoded hex.
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          subtle: 'hsl(var(--warning-subtle))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          subtle: 'hsl(var(--success-subtle))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        urdu: ["var(--font-jameel)", "serif"],
      },

      spacing: {
        // The fixed site header's height (globals.css --header-h): h-header on
        // the bar, top-header on anything sticky beneath it.
        header: 'var(--header-h)',
        72: '18rem',
        84: '21rem',
        96: '24rem',
      },
      borderRadius: {
        '4xl': '2rem',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },

  plugins: [tailwindcssAnimate],
};

export default config;
