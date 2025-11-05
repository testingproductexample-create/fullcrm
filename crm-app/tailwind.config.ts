import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          start: '#E8EAF0',
          mid: '#F4F5F9',
          end: '#FAFBFF',
        },
        primary: {
          50: '#E6F0FF',
          100: '#CCE0FF',
          500: '#0066FF',
          600: '#0052CC',
          900: '#003D99',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          500: '#A3A3A3',
          700: '#404040',
          900: '#171717',
        },
        semantic: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.4)',
          emphasized: 'rgba(255, 255, 255, 0.5)',
          subtle: 'rgba(255, 255, 255, 0.35)',
          dark: 'rgba(30, 30, 30, 0.5)',
          border: 'rgba(255, 255, 255, 0.3)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        hero: ['72px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        h1: ['56px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        h2: ['40px', { lineHeight: '1.3' }],
        h3: ['28px', { lineHeight: '1.4' }],
        large: ['20px', { lineHeight: '1.6' }],
        body: ['16px', { lineHeight: '1.5' }],
        small: ['14px', { lineHeight: '1.5' }],
        tiny: ['12px', { lineHeight: '1.4', letterSpacing: '0.01em' }],
      },
      spacing: {
        '2': '8px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
        '24': '96px',
        '32': '128px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.1)',
        glass: '0 8px 32px rgba(0,0,0,0.08)',
        'glass-hover': '0 12px 40px rgba(0,0,0,0.12)',
      },
      backdropBlur: {
        light: '15px',
        standard: '20px',
        strong: '40px',
      },
      animation: {
        'fade-in': 'fadeIn 400ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
