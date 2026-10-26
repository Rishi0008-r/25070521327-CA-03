/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkbg: '#0B0E17',
        darkcard: '#111827',
        darkcardhover: '#151D30',
        darkborder: '#1F293D',
        accent: {
          indigo: '#4F46E5',
          purple: '#7C3AED',
          hover: '#4338CA',
        },
        railway: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
          950: '#031726',
        },
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'train-glide': 'glide 8s ease-in-out infinite',
      },
      keyframes: {
        glide: {
          '0%, 100%': { transform: 'translateX(0%)' },
          '50%': { transform: 'translateX(5%)' },
        },
      },
    },
  },
  plugins: [],
}
