/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cinema: {
          bg:      '#0a0a0f',
          surface: '#12121a',
          card:    '#1a1a26',
          border:  '#2a2a3a',
          gold:    '#f5c518',
          accent:  '#e50914',
          muted:   '#6b6b80',
          text:    '#e8e8f0',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(229,9,20,0.15), transparent)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.5s ease-out',
        'shimmer':    'shimmer 1.5s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer:   { '0%,100%': { opacity: 0.5 }, '50%': { opacity: 1 } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 20px rgba(245,197,24,0.3)' }, '50%': { boxShadow: '0 0 40px rgba(245,197,24,0.6)' } },
      },
    },
  },
  plugins: [],
}
