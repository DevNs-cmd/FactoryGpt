/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // industrial / factory-floor palette: dark slate base, amber for
        // alerts/warnings, cyan for "live/active" status — deliberately
        // not the generic cream+terracotta or dark+acid-green defaults.
        base: "#12161c",
        panel: "#1b212b",
        line: "#2a323f",
        amber: "#e8a33d",
        cyan: "#3dc7c7",
        danger: "#e0563f",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
