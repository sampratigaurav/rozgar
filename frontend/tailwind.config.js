/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50:  '#FFF3E8',
          100: '#FFE4C4',
          200: '#FFCC99',
          300: '#FFB266',
          400: '#FF9933',
          DEFAULT: '#FF6B00',
          600: '#E55F00',
          700: '#CC5500',
          800: '#994000',
          900: '#662A00',
        },
        ember: '#FF4500',
      },
      backgroundImage: {
        'saffron-gradient': 'linear-gradient(135deg, #FF6B00 0%, #FF4500 100%)',
        'saffron-soft':     'linear-gradient(135deg, #FFF3E8 0%, #FFE4C4 100%)',
      },
      animation: {
        'slide-up':      'slideUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-down':    'slideDown 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':       'fadeIn 0.4s ease-out forwards',
        'scale-in':      'scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'bounce-in':     'bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'float':         'float 3s ease-in-out infinite',
        'radar':         'radarRing 2s ease-out infinite',
        'shimmer':       'shimmer 1.8s linear infinite',
        'pulse-ring':    'pulseRing 2.2s ease-in-out infinite',
        'toast-in':      'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'toast-out':     'toastOut 0.3s ease-in forwards',
        'spin-slow':     'spin 2.5s linear infinite',
        'wiggle':        'wiggle 0.4s ease-in-out',
        'count-up':      'countUp 0.5s ease-out forwards',
      },
      keyframes: {
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceIn: {
          '0%':   { opacity: '0', transform: 'scale(0.4)' },
          '60%':  { transform: 'scale(1.08)' },
          '80%':  { transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        radarRing: {
          '0%':   { transform: 'scale(0.4)', opacity: '0.9' },
          '100%': { transform: 'scale(3.5)', opacity: '0' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseRing: {
          '0%':   { boxShadow: '0 0 0 0 rgba(255,107,0,0.5)' },
          '70%':  { boxShadow: '0 0 0 16px rgba(255,107,0,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(255,107,0,0)' },
        },
        toastIn: {
          '0%':   { opacity: '0', transform: 'translateY(-16px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        toastOut: {
          '0%':   { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-10px) scale(0.95)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%':      { transform: 'rotate(-8deg)' },
          '75%':      { transform: 'rotate(8deg)' },
        },
        countUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34,1.56,0.64,1)',
        'smooth': 'cubic-bezier(0.16,1,0.3,1)',
      },
      boxShadow: {
        'glow':        '0 0 20px rgba(255,107,0,0.3)',
        'glow-strong': '0 0 40px rgba(255,107,0,0.5)',
        'card':        '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'card-hover':  '0 8px 30px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
        'card-lifted': '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
