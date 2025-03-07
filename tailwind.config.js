/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        colors: {
          // Custom colors that match our design
          primary: {
            DEFAULT: '#3b82f6',
            light: '#60a5fa',
            dark: '#2563eb',
          },
          secondary: {
            DEFAULT: '#8b5cf6',
            light: '#a78bfa',
            dark: '#7c3aed',
          },
          tertiary: {
            DEFAULT: '#ec4899',
            light: '#f472b6',
            dark: '#db2777',
          },
          success: {
            DEFAULT: '#10b981',
            light: '#a7f3d0',
          },
          warning: {
            DEFAULT: '#f59e0b',
            light: '#fde68a',
          },
          error: {
            DEFAULT: '#ef4444',
            light: '#fecaca',
          },
          info: {
            DEFAULT: '#0ea5e9',
            light: '#bae6fd',
          },
        },
        fontFamily: {
          sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
          heading: ['Outfit', 'Inter', 'ui-sans-serif', 'system-ui'],
        },
        animation: {
          'float': 'float 3s ease-in-out infinite',
          'ripple': 'ripple 2s linear infinite',
          'border-dance': 'border-dance 2s linear infinite',
        },
        keyframes: {
          float: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-10px)' },
          },
          ripple: {
            '0%': { transform: 'scale(0)', opacity: 1 },
            '50%': { transform: 'scale(1.5)', opacity: 0.5 },
            '100%': { transform: 'scale(2)', opacity: 0 },
          },
          'border-dance': {
            '0%': { backgroundPosition: '0% 0%' },
            '100%': { backgroundPosition: '300% 0%' },
          },
        },
        boxShadow: {
          'blue': '0 4px 14px rgba(59, 130, 246, 0.25)',
          'purple': '0 4px 14px rgba(139, 92, 246, 0.25)',
        },
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
          'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        },
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
        },
      },
    },
    plugins: [],
  }