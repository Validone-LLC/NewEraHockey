/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0a0e12',
          dark: '#050709',
          light: '#141b24',
        },
        teal: {
          50: '#e6f7fb',
          100: '#b3e8f4',
          200: '#80d9ed',
          300: '#4dcae6',
          400: '#33c2e3',
          500: '#1ab8df', // Main brand teal
          600: '#159fbd',
          700: '#11869b',
          800: '#0d6d7a',
          900: '#095458',
        },
        silver: {
          DEFAULT: '#b8c5d0',
          light: '#d4dde5',
          dark: '#8a9baa',
        },
        neutral: {
          bg: '#0f1419',
          text: '#9ca3af',
          light: '#e5e7eb',
          dark: '#1f2937',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      },
      spacing: {
        128: '32rem',
        144: '36rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-down': 'slideDown 0.6s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};
