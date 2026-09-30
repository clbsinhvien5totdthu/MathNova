/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Màu đỏ thương hiệu CLB Sinh viên 5 tốt
        sv5t: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          600: '#e11d48', // Màu chủ đạo
          700: '#be123c',
        },
        // Tông màu tối cho giao diện không gian học tập
        room: {
          bg: '#0a0a0a',
          panel: '#121212',
          card: '#1a1a1a',
          border: '#262626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'glow-pulse': 'glow 3s infinite ease-in-out',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.7' },
        }
      }
    },
  },
  plugins: [],
}
