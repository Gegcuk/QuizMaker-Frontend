import forms from "@tailwindcss/forms";          // ← plugin import

/** @type {import('tailwindcss').Config} */
export default {
  /*  Tell Tailwind where to look for class names  */
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],

  theme: {
    extend: {},
  },

  /*  Register plugins here  */
  plugins: [forms],
};
