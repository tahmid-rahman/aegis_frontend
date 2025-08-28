/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./providers/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#7C3AED", // Vibrant purple
        secondary: "#10B981", // Emerald green
        background: "#F5F3FF", // Soft lavender
        surface: "#EDE9FE", // Pale lavender
        accent: "#F472B6", // Bright pink
        text: "#1F2937", // Dark gray-blue
      },
    },
  },
  plugins: [],
};