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
              "primary": "#005131",
              "inverse-on-surface": "#ecf2ee",
              "tertiary-fixed-dim": "#ffb3b5",
              "surface-container-lowest": "#ffffff",
              "surface-container-low": "#eff5f1",
              "secondary-container": "#feae2c",
              "tertiary-fixed": "#ffdada",
              "surface-tint": "#1b6b45",
              "on-tertiary-container": "#ffcbcc",
              "tertiary-container": "#93464b",
              "outline-variant": "#bfc9bf",
              "on-secondary": "#ffffff",
              "on-primary": "#ffffff",
              "inverse-surface": "#2c322f",
              "secondary-fixed-dim": "#ffb953",
              "on-secondary-fixed-variant": "#633f00",
              "secondary": "#835500",
              "inverse-primary": "#8ad7a8",
              "on-tertiary-fixed": "#3d040d",
              "on-surface-variant": "#3f4942",
              "on-secondary-fixed": "#291800",
              "primary-fixed": "#a5f3c3",
              "primary-container": "#1a6b45",
              "surface-container-high": "#e4eae6",
              "surface-container": "#e9efeb",
              "secondary-fixed": "#ffddb4",
              "on-surface": "#171d1b",
              "error": "#ba1a1a",
              "on-background": "#171d1b",
              "surface-variant": "#dee4e0",
              "surface": "#f5fbf7",
              "on-error": "#ffffff",
              "surface-dim": "#d5dbd7",
              "error-container": "#ffdad6",
              "tertiary": "#762f35",
              "primary-fixed-dim": "#8ad7a8",
              "on-secondary-container": "#6b4500",
              "on-primary-fixed-variant": "#005231",
              "on-error-container": "#93000a",
              "surface-bright": "#f5fbf7",
              "on-primary-container": "#9be9b9",
              "background": "#f5fbf7",
              "outline": "#6f7a71",
              "surface-container-highest": "#dee4e0"
      },
      "fontFamily": {
        "sans": ["var(--font-dm-sans)", "sans-serif"],
        "display": ["var(--font-plus-jakarta)", "sans-serif"],
      }
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/forms')
  ],
};
export default config;
