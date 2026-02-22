/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          dark:    '#0B1220',
          primary: '#0F172A',
          card:    '#0F172A',
          elevated:'#1E293B',
        },
        brand: {
          green: '#10B981',
          dark:  '#059669',
        },
      },
    },
  },
  plugins: [],
}
