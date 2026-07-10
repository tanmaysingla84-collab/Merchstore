/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          maroon: {
            50: '#FDF4F6',
            100: '#FBE8ED',
            200: '#F5C6D3',
            300: '#EEA4B9',
            400: '#E26186',
            500: '#CD2D5D',
            600: '#A42047',
            700: '#8A173A', // GU Primary Maroon
            800: '#69122C',
            900: '#520D22',
            950: '#330613',
          },
          gold: {
            50: '#FCFBF2',
            100: '#FAF6DC',
            200: '#F2E9AA',
            300: '#EBDC77',
            400: '#E1CA4A',
            500: '#D4AF37', // GU Secondary Gold
            600: '#AF8E25',
            700: '#8B6F1B',
            800: '#685112',
            900: '#513E0E',
            950: '#302405',
          },
          dark: {
            50: '#F8FAFC',
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
            500: '#64748B',
            600: '#475569',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
            950: '#030712',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 12px 40px -10px rgba(138, 23, 58, 0.08)',
        'premium-hover': '0 24px 50px -12px rgba(138, 23, 58, 0.18)',
        'gold-glow': '0 12px 40px -10px rgba(212, 175, 55, 0.12)',
        'glass': '0 8px 32px 0 rgba(138, 23, 58, 0.04)',
        'glass-hover': '0 16px 40px 0 rgba(138, 23, 58, 0.08)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(138, 23, 58, 0.4)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(138, 23, 58, 0.1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      }
    },
  },
  plugins: [],
}
