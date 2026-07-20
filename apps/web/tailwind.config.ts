import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        mn: {
          ink: '#0e0f11',
          paper: '#f5f3ee',
          cream: '#ede9e1',
          accent: '#e8472a',
          'accent-soft': '#fde8e4',
          gold: '#c8973a',
          teal: '#1a6b5a',
          'teal-soft': '#e0f0eb',
          mid: '#6b6860',
          border: '#d5d0c7',
        },
        purple: { DEFAULT: '#c8973a', light: '#fdf3e1', dark: '#a67c2e' },
        teal: { DEFAULT: '#1a6b5a', light: '#e0f0eb', dark: '#145a4a' },
        blue: { DEFAULT: '#1a6b5a', light: '#e0f0eb', dark: '#145a4a' },
        coral: { DEFAULT: '#e8472a', light: '#fde8e4' },
        amber: { DEFAULT: '#c8973a', light: '#fdf3e1' },
        green: { DEFAULT: '#1a6b5a', light: '#e0f0eb' },
        gray: { DEFAULT: '#6b6860', light: '#ede9e1', dark: '#0e0f11' },
        border: '#d5d0c7',
        bg: '#f5f3ee',
      },
      fontFamily: {
        outfit: ['var(--font-outfit)', 'Outfit', 'sans-serif'],
        display: ['var(--font-outfit)', 'Outfit', 'sans-serif'],
        syne: ['var(--font-outfit)', 'Outfit', 'sans-serif'],
        sans: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'DM Mono', 'monospace'],
        number: ['var(--font-dm-mono)', 'DM Mono', 'tabular-nums', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.02em',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 16px rgba(0,0,0,0.10)',
        lg: '0 8px 32px rgba(0,0,0,0.12)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'shop-reveal': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
        'fade-in': 'fade-in 0.35s ease-out both',
        'slide-up': 'slide-up 0.4s ease-out both',
        'shop-reveal': 'shop-reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
