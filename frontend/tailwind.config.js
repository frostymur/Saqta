/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          bg: "#F1F5F9",
          card: "#FFFFFF",
          header: "#0F2942",
          headerDark: "#0A1D30",
          blue: "#1E3A8A",
          primary: "#0284C7",
          accent: "#2563EB",
          gold: "#F59E0B",
          text: "#0F172A",
          muted: "#475569",
          border: "#E2E8F0"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}
