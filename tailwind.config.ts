import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      "colors": {
              "on-tertiary": "#ffffff",
              "on-primary-fixed": "#002111",
              "on-tertiary-fixed-variant": "#763035",
              "primary": "#0f6b45",
              "inverse-on-surface": "#f1f5f9",
              "tertiary-fixed-dim": "#ffb3b5",
              "surface-container-lowest": "#ffffff",
              "surface-container-low": "#eef1f4",
              "secondary-container": "#feae2c",
              "tertiary-fixed": "#ffdada",
              "surface-tint": "#147a50",
              "on-tertiary-container": "#ffcbcc",
              "tertiary-container": "#93464b",
              "outline-variant": "#e2e8f0",
              "on-secondary": "#ffffff",
              "on-primary": "#ffffff",
              "inverse-surface": "#1e293b",
              "secondary-fixed-dim": "#ffb953",
              "on-secondary-fixed-variant": "#633f00",
              "secondary": "#835500",
              "inverse-primary": "#6ee7a8",
              "on-tertiary-fixed": "#3d040d",
              "on-surface-variant": "#64748b",
              "on-secondary-fixed": "#291800",
              "primary-fixed": "#d1fae5",
              "primary-container": "#147a50",
              "surface-container-high": "#e2e8f0",
              "surface-container": "#eef1f4",
              "secondary-fixed": "#ffddb4",
              "on-surface": "#0f172a",
              "error": "#dc2626",
              "on-background": "#0f172a",
              "surface-variant": "#e2e8f0",
              "surface": "#f3f5f7",
              "on-error": "#ffffff",
              "surface-dim": "#cbd5e1",
              "error-container": "#fee2e2",
              "tertiary": "#762f35",
              "primary-fixed-dim": "#6ee7a8",
              "on-secondary-container": "#6b4500",
              "on-primary-fixed-variant": "#0f6b45",
              "on-error-container": "#991b1b",
              "surface-bright": "#f3f5f7",
              "on-primary-container": "#d1fae5",
              "background": "#f3f5f7",
              "outline": "#94a3b8",
              "surface-container-highest": "#e2e8f0"
      },
      "fontFamily": {
        "sans": ["var(--font-dm-sans)", "sans-serif"],
        "display": ["var(--font-plus-jakarta)", "sans-serif"],
        "headline": ["var(--font-plus-jakarta)", "sans-serif"],
        "body": ["var(--font-dm-sans)", "sans-serif"],
        "label": ["var(--font-dm-sans)", "sans-serif"],
      }
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/forms')
  ],
};
export default config;
