/** Bảng màu và chữ của NailCare – xem src/index.css cho các lớp dùng chung */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#2B1E25', soft: '#5E4D55', muted: '#8A7880' },
        cream: { DEFAULT: '#FBF7F3', deep: '#F4ECE6' },
        line: '#EADDD6',
        rose: { 50: '#FCF1F4', 100: '#F7E1E8', 200: '#EFC3D1', 400: '#CF7593', 500: '#B6506F', 600: '#9C3E5C', 700: '#7E3049' },
        gold: { 300: '#E2C9A0', 500: '#B8955A' },
        plum: '#3F2433',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(63,36,51,.06), 0 8px 24px -12px rgba(63,36,51,.18)',
        lift: '0 2px 4px rgba(63,36,51,.06), 0 18px 40px -16px rgba(63,36,51,.30)',
      },
      borderRadius: { xl2: '1.25rem' },
    },
  },
  plugins: [],
}
