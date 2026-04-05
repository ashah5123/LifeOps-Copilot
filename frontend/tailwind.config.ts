import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        background: "var(--bg)",
        foreground: "var(--fg)",
        surface: "var(--sf)",
        "surface-hover": "var(--sfh)",
        primary: {
          DEFAULT: "#5E6AD2",
          hover: "#7C85E0",
        },
        accent: "#F5A524",
        "text-primary": "var(--tp)",
        "text-secondary": "var(--ts)",
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
        border: "var(--bd)",
        sidebar: {
          DEFAULT: "var(--sb)",
          hover: "var(--sbh)",
          active: "#5E6AD2",
        },
      },
    },
  },
  plugins: [],
};

export default config;
