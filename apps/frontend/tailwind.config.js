/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#F8F9FA",
        panel: "#FFFFFF",
        "panel-hover": "#F8F9FA",
        surface: "#F1F3F5",
        line: "#E2E8F0",
        primary: "#2563EB",
        "primary-light": "rgba(37, 99, 235, 0.08)",
        amber: "#D97706",
        "amber-light": "rgba(217, 119, 6, 0.08)",
        danger: "#DC2626",
        "danger-light": "rgba(220, 38, 38, 0.08)",
        success: "#16A34A",
        "success-light": "rgba(22, 163, 74, 0.08)",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out forwards",
        "slide-up": "slideUp 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};
