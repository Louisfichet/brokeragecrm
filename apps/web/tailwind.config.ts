import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e3a5f",
          900: "#0f172a",
          950: "#0a0f1a",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
        "glass-sm": "0 4px 16px 0 rgba(31, 38, 135, 0.1)",
        "glass-lg": "0 12px 48px 0 rgba(31, 38, 135, 0.2)",
        glow: "0 0 20px rgba(59, 130, 246, 0.3)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-in": "slideIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      width: {
        sidebar: "16rem",
        "sidebar-collapsed": "4.5rem",
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".glass": {
          "backdrop-filter": "blur(16px) saturate(180%)",
          "-webkit-backdrop-filter": "blur(16px) saturate(180%)",
          "background-color": "rgba(255, 255, 255, 0.08)",
          "border": "1px solid rgba(255, 255, 255, 0.15)",
          "box-shadow": "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
        },
        ".glass-light": {
          "backdrop-filter": "blur(16px) saturate(180%)",
          "-webkit-backdrop-filter": "blur(16px) saturate(180%)",
          "background-color": "rgba(255, 255, 255, 0.75)",
          "border": "1px solid rgba(255, 255, 255, 0.3)",
          "box-shadow": "0 8px 32px 0 rgba(31, 38, 135, 0.1)",
        },
        ".glass-dark": {
          "backdrop-filter": "blur(20px) saturate(180%)",
          "-webkit-backdrop-filter": "blur(20px) saturate(180%)",
          "background-color": "rgba(15, 23, 42, 0.6)",
          "border": "1px solid rgba(255, 255, 255, 0.08)",
          "box-shadow": "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
        },
        ".glass-card": {
          "backdrop-filter": "blur(12px) saturate(150%)",
          "-webkit-backdrop-filter": "blur(12px) saturate(150%)",
          "background-color": "rgba(255, 255, 255, 0.05)",
          "border": "1px solid rgba(255, 255, 255, 0.1)",
          "border-radius": "1rem",
          "box-shadow": "0 4px 16px 0 rgba(31, 38, 135, 0.1)",
        },
      });
    }),
  ],
};

export default config;
