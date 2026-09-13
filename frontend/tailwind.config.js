/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        doan: {
          50: '#eef6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#1d4ed8',
          600: '#0054a6', // Màu xanh Đoàn chính thức
          700: '#004285', // Hover xanh đậm hơn
          800: '#1e3a8a',
          900: '#172554',
        }
      },
      fontFamily: {
        sans: ['Lexend', 'Be Vietnam Pro', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out forwards',
        'slide-left': 'slideLeft 0.4s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
