
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        mint: {
          50: '#f2fbf9',
          100: '#DDF5EE', // mint green
          200: '#bce8db',
          300: '#86efac',
          400: '#4ade80',
          500: '#DDF5EE', 
          600: '#16a34a',
        },
        aqua: {
          50: '#f0fbf9',
          100: '#CDEFE8', // soft aqua
          500: '#CDEFE8',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          400: '#34d399',
          500: '#22C55E', // primary action/success
          600: '#16a34a',
        },
        turquoise: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          400: '#38BDF8',
          500: '#38BDF8', // secondary accent
          600: '#0284c7',
        },
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          400: '#22D3EE',
          500: '#22D3EE', // analytics/interactive
          600: '#0891b2',
        },
        navy: {
          600: '#475569', // existing
          700: '#334155', // charcoal (higher elevation)
          800: '#273449', // slate blue (elevated surface)
          900: '#1F2937', // deep navy (base)
          950: '#111827',
        },
        electric: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        }
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(0, 0, 0, 0.08), 0 4px 12px -4px rgba(0, 0, 0, 0.04)',
        'soft-dark': '0 10px 40px -10px rgba(0, 0, 0, 0.5), 0 4px 12px -4px rgba(0, 0, 0, 0.3)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      },
      animation: {
        shine: 'shine var(--duration) infinite linear',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        shine: {
          '0%': {
            'background-position': '0% 0%',
          },
          '50%': {
            'background-position': '100% 100%',
          },
          to: {
            'background-position': '0% 0%',
          },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
