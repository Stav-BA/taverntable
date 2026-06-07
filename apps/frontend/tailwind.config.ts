import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#F4E4BC',
        'parchment-dark': '#E8D5A0',
        'dark-brown': '#2D1B00',
        'medium-brown': '#5C3D1E',
        gold: '#C9A227',
        'gold-light': '#E8C84A',
        'deep-red': '#8B1A1A',
        'forest-green': '#2D5016',
        'forest-green-light': '#3D6B1E',
        ink: '#1A0F00',
        'shadow-dark': 'rgba(0,0,0,0.7)',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        crimson: ['Crimson Text', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'parchment-texture':
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'tavern-sm': '0 2px 4px rgba(45,27,0,0.3), inset 0 1px 0 rgba(201,162,39,0.2)',
        tavern: '0 4px 12px rgba(45,27,0,0.4), inset 0 1px 0 rgba(201,162,39,0.3)',
        'tavern-lg': '0 8px 24px rgba(45,27,0,0.5), inset 0 1px 0 rgba(201,162,39,0.3)',
        'tavern-inset': 'inset 0 2px 8px rgba(45,27,0,0.4)',
        gold: '0 0 12px rgba(201,162,39,0.5)',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'dice-roll': 'diceRoll 0.6s ease-in-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'float-in': 'floatIn 0.4s ease-out',
        'dice-bg': 'diceBg 8s linear infinite',
      },
      keyframes: {
        diceRoll: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '25%': { transform: 'rotate(180deg) scale(1.2)' },
          '75%': { transform: 'rotate(540deg) scale(0.9)' },
          '100%': { transform: 'rotate(720deg) scale(1)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(201,162,39,0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(201,162,39,0.8), 0 0 40px rgba(201,162,39,0.3)' },
        },
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        diceBg: {
          '0%': { transform: 'translateY(0) rotate(0deg)' },
          '100%': { transform: 'translateY(-100vh) rotate(360deg)' },
        },
      },
    },
  },
  plugins: [
    // RTL support: adds rtl: and ltr: variants so components can use
    // e.g. `rtl:text-right ltr:text-left` based on [dir] attribute on <html>
    ({ addVariant }: { addVariant: (name: string, selector: string) => void }) => {
      addVariant('rtl', '[dir="rtl"] &');
      addVariant('ltr', '[dir="ltr"] &');
    },
  ],
};

export default config;
