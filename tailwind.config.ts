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
      colors: {
        // Material Design 3 Dynamic & Tonal Palette Colors
        m3: {
          primary: "var(--md-sys-color-primary)",
          "on-primary": "var(--md-sys-color-on-primary)",
          "primary-container": "var(--md-sys-color-primary-container)",
          "on-primary-container": "var(--md-sys-color-on-primary-container)",

          secondary: "var(--md-sys-color-secondary)",
          "on-secondary": "var(--md-sys-color-on-secondary)",
          "secondary-container": "var(--md-sys-color-secondary-container)",
          "on-secondary-container": "var(--md-sys-color-on-secondary-container)",

          tertiary: "var(--md-sys-color-tertiary)",
          "on-tertiary": "var(--md-sys-color-on-tertiary)",
          "tertiary-container": "var(--md-sys-color-tertiary-container)",
          "on-tertiary-container": "var(--md-sys-color-on-tertiary-container)",

          error: "var(--md-sys-color-error)",
          "on-error": "var(--md-sys-color-on-error)",
          "error-container": "var(--md-sys-color-error-container)",
          "on-error-container": "var(--md-sys-color-on-error-container)",

          surface: "var(--md-sys-color-surface)",
          "on-surface": "var(--md-sys-color-on-surface)",
          "surface-variant": "var(--md-sys-color-surface-variant)",
          "on-surface-variant": "var(--md-sys-color-on-surface-variant)",

          "surface-dim": "var(--md-sys-color-surface-dim)",
          "surface-bright": "var(--md-sys-color-surface-bright)",
          "surface-container-lowest": "var(--md-sys-color-surface-container-lowest)",
          "surface-container-low": "var(--md-sys-color-surface-container-low)",
          "surface-container": "var(--md-sys-color-surface-container)",
          "surface-container-high": "var(--md-sys-color-surface-container-high)",
          "surface-container-highest": "var(--md-sys-color-surface-container-highest)",

          outline: "var(--md-sys-color-outline)",
          "outline-variant": "var(--md-sys-color-outline-variant)",
          scrim: "var(--md-sys-color-scrim)",

          // Network Custom Status Tonal Colors
          success: "var(--md-sys-color-success)",
          "success-container": "var(--md-sys-color-success-container)",
          "on-success-container": "var(--md-sys-color-on-success-container)",

          warning: "var(--md-sys-color-warning)",
          "warning-container": "var(--md-sys-color-warning-container)",
          "on-warning-container": "var(--md-sys-color-on-warning-container)",

          info: "var(--md-sys-color-info)",
          "info-container": "var(--md-sys-color-info-container)",
          "on-info-container": "var(--md-sys-color-on-info-container)",
        },
      },
      borderRadius: {
        "m3-none": "0px",
        "m3-xs": "4px",
        "m3-sm": "8px",
        "m3-md": "12px",
        "m3-lg": "16px",
        "m3-xl": "20px",
        "m3-2xl": "24px",
        "m3-3xl": "28px",
        "m3-full": "9999px",
      },
      boxShadow: {
        "m3-1": "0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)",
        "m3-2": "0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)",
        "m3-3": "0px 1px 3px 0px rgba(0, 0, 0, 0.30), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)",
        "m3-4": "0px 2px 3px 0px rgba(0, 0, 0, 0.30), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)",
        "m3-5": "0px 4px 4px 0px rgba(0, 0, 0, 0.30), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)",
      },
      fontFamily: {
        sans: ["var(--font-roboto)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-roboto)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
