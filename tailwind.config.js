/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        youtube: {
          red: '#FF0000',
          dark: '#0f0f0f',
          darker: '#030303',
          gray: '#272727',
          lightgray: '#3f3f3f',
        }
      }
    },
  },
  plugins: [],
}
