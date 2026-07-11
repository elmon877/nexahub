import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#aacec3",
        "on-primary": "#14362e",
        "primary-container": "#1a3c34",
        "on-primary-container": "#83a69c",
        "secondary": "#c4c7c7",
        "on-secondary": "#2d3131",
        "secondary-container": "#434747",
        "on-secondary-container": "#b2b6b5",
        "tertiary": "#a9cec2",
        "on-tertiary": "#13362e",
        "tertiary-container": "#1a3c34",
        "on-tertiary-container": "#83a79b",
        "error": "#ffb4ab",
        "on-error": "#690005",
        "error-container": "#93000a",
        "on-error-container": "#ffdad6",
        "background": "#080A0A",
        "on-background": "#e2e2e2",
        "surface": "#121414",
        "on-surface": "#e2e2e2",
        "surface-variant": "#333535",
        "on-surface-variant": "#c1c8c4",
        "surface-container": "#1e2020",
        "surface-container-low": "#1a1c1c",
        "surface-container-high": "#282a2a",
        "surface-container-highest": "#333535",
        "surface-container-lowest": "#0c0f0f",
        "outline": "#8b928f",
        "outline-variant": "#414846",
      },
      fontFamily: {
        'display': ['Hanken Grotesk', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;