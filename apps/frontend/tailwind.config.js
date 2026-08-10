/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0c1017",
        panel: "#141a24",
        "panel-hover": "#1a2230",
        surface: "#1e2736",
        line: "#2a323f",
        cyan: "#3dc7c7",
        "cyan-glow": "rgba(61, 199, 199, 0.15)",
        amber: "#e8a33d",
        "amber-glow": "rgba(232, 163, 61, 0.15)",
        danger: "#e0563f",
        "danger-glow": "rgba(224, 86, 63, 0.15)",
        success: "#34d399",
        "success-glow": "rgba(52, 211, 153, 0.15)",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
