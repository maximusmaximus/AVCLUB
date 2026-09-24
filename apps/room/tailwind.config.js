/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#07070A",
        surface: "#111118",
        cyberCyan: "#00F0FF",
        neonPurple: "#7000FF",
        laserAmber: "#FFB800",
        dangerRed: "#FF2A6D",
        signalGreen: "#00FF88",
      },
      fontFamily: {
        sans: ["'Open Sans'", "sans-serif"],
        mono: ["Consolas", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};
