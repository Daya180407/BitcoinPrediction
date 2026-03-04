/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A2A43',
          50: '#0d3354',
          100: '#0f3d64',
          200: '#0A2A43',
          900: '#051520'
        },
        accent: {
          DEFAULT: '#1E9E56',
          light: '#25bf68',
          dark: '#167a42'
        },
        danger: '#e53e3e',
        warning: '#d69e2e',
        surface: '#0f1f2e',
        card: '#0d1f30',
        border: '#1a3448'
      },
      fontFamily: {
        display: ['"Exo 2"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      animation: {
        'pulse-green': 'pulseGreen 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'ticker': 'ticker 30s linear infinite',
        'count-down': 'countdown 1s linear'
      },
      keyframes: {
        pulseGreen: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        },
        glow: {
          from: { boxShadow: '0 0 10px #1E9E56' },
          to: { boxShadow: '0 0 25px #1E9E56, 0 0 50px #1E9E5640' }
        },
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' }
        }
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(30, 158, 86, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 158, 86, 0.05) 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))'
      },
      backgroundSize: {
        'grid': '40px 40px'
      }
    }
  },
  plugins: []
};
