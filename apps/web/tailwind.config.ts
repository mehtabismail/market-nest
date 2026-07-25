import type { Config } from 'tailwindcss';

/**
 * Web Tailwind theme.
 *
 * The `mn-*` colour scale is driven by CSS custom properties (RGB channel
 * triplets) so a single palette can be re-themed per portal without recompiling
 * utilities. Defaults live in `globals.css :root` (coral — admin + legacy);
 * the premium "Lumen" palette is scoped to `.shop-theme, .seller-theme` in
 * `marketnest-theme.css`. Alpha modifiers (`bg-mn-paper/90`) work because each
 * colour is `rgb(var(--x) / <alpha-value>)`.
 */
const channel = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        mn: {
          ink: channel('--mn-ink'),
          paper: channel('--mn-paper'),
          cream: channel('--mn-cream'),
          surface: channel('--mn-surface'),
          accent: channel('--mn-accent'),
          'accent-soft': channel('--mn-accent-soft'),
          'accent-2': channel('--mn-accent-2'),
          gold: channel('--mn-gold'),
          'gold-soft': channel('--mn-gold-soft'),
          teal: channel('--mn-teal'),
          'teal-soft': channel('--mn-teal-soft'),
          rose: channel('--mn-rose'),
          mid: channel('--mn-mid'),
          border: channel('--mn-border'),
        },
        // Legacy aliases — kept for older components; portal CSS remaps them.
        purple: { DEFAULT: '#c8973a', light: '#fdf3e1', dark: '#a67c2e' },
        teal: { DEFAULT: '#1a6b5a', light: '#e0f0eb', dark: '#145a4a' },
        blue: { DEFAULT: '#1a6b5a', light: '#e0f0eb', dark: '#145a4a' },
        coral: { DEFAULT: '#e8472a', light: '#fde8e4' },
        amber: { DEFAULT: '#c8973a', light: '#fdf3e1' },
        green: { DEFAULT: '#1a6b5a', light: '#e0f0eb' },
        gray: { DEFAULT: '#6b6860', light: '#ede9e1', dark: '#0e0f11' },
        border: 'rgb(var(--mn-border) / <alpha-value>)',
        bg: 'rgb(var(--mn-paper) / <alpha-value>)',
      },
      fontFamily: {
        // `font-outfit` is repointed to the new display face so every existing
        // usage upgrades to Syne without a codemod.
        outfit: ['var(--font-syne)', 'Syne', 'sans-serif'],
        display: ['var(--font-syne)', 'Syne', 'sans-serif'],
        syne: ['var(--font-syne)', 'Syne', 'sans-serif'],
        serif: ['var(--font-instrument)', 'Instrument Serif', 'serif'],
        sans: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'DM Mono', 'monospace'],
        number: ['var(--font-dm-mono)', 'DM Mono', 'tabular-nums', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.02em',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '18px',
        xl: '24px',
        '2xl': '28px',
        '3xl': '34px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(15,12,24,0.06)',
        md: '0 6px 24px rgba(15,12,24,0.08)',
        lg: '0 16px 48px rgba(15,12,24,0.12)',
        glow: '0 10px 40px -8px rgb(var(--mn-accent) / 0.45)',
        'glow-sm': '0 6px 22px -6px rgb(var(--mn-accent) / 0.4)',
      },
      backgroundImage: {
        'accent-grad':
          'linear-gradient(120deg, rgb(var(--mn-accent)) 0%, rgb(var(--mn-accent-2)) 100%)',
        'accent-radial':
          'radial-gradient(ellipse 60% 60% at 50% 0%, rgb(var(--mn-accent) / 0.16) 0%, transparent 70%)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'fade-in': { from: { transform: 'translateY(6px)' }, to: { transform: 'translateY(0)' } },
        // Transform-only so content never depends on the animation clock to be
        // visible (a backgrounded tab freezes CSS animations at `from`).
        'slide-up': {
          from: { transform: 'translateY(14px)' },
          to: { transform: 'translateY(0)' },
        },
        'shop-reveal': {
          from: { transform: 'translateY(16px)' },
          to: { transform: 'translateY(0)' },
        },
        shine: {
          '0%': { transform: 'translateX(-120%) skewX(-12deg)' },
          '100%': { transform: 'translateX(220%) skewX(-12deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '0.85' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'aurora-drift': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(3%,-4%,0) scale(1.08)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
        'fade-in': 'fade-in 0.35s ease-out both',
        'slide-up': 'slide-up 0.4s ease-out both',
        'shop-reveal': 'shop-reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        shine: 'shine 1.1s ease-out',
        'glow-pulse': 'glow-pulse 5s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'aurora-drift': 'aurora-drift 18s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
