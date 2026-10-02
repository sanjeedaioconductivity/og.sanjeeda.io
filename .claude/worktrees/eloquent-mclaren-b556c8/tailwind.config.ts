import { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: ['./public/**/*.html', './src/**/*.{js,ts,jsx,tsx}'],

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
        // 🔵 Brand Colors
        customBlue: '#00838F',
        darkBlue: '#060b2d',
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
