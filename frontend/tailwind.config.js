/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spruce: {
          950: "#022c22",
          900: "#064e3b",
          800: "#065f46",
          700: "#047857",
          600: "#059669",
          500: "#10b981",
          100: "#d1fae5",
          50: "#ecfdf5"
        },
        river: {
          800: "#075985",
          700: "#0369a1",
          600: "#0284c7",
          500: "#0ea5e9",
          100: "#e0f2fe",
          50: "#f0f9ff"
        }
      },
      fontFamily: {
        sans: ["Onest", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}
