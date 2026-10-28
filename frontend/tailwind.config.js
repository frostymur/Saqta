/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saqta: {
          bg: "#0B1120",
          card: "#131C31",
          border: "#1E293B",
          primary: "#0284C7",
          accent: "#06B6D4",
          danger: "#EF4444",
          warning: "#F59E0B",
          success: "#10B981"
        }
      }
    },
  },
  plugins: [],
}
