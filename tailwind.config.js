/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // EMRAC brand navy (from the web app's login gradient / nav)
        navy: {
          700: '#1B2B6B',
          800: '#0D1B45',
          900: '#0F2060',
        },
      },
    },
  },
  plugins: [],
};
