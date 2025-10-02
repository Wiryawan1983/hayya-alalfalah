/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",        // untuk CRA (create-react-app)
    "./src/**/*.{js,jsx,ts,tsx}", // semua komponen
  ],
  darkMode: "class",
  theme: { extend: {} },
  plugins: [],
};


