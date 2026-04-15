/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'SF Pro Text'", "'SF Pro Icons'", "'Helvetica Neue'", 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
