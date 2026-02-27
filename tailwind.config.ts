import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fb: {
          blue: "#1877F2",
          "blue-dark": "#166FE5",
          "blue-light": "#E7F3FF",
          green: "#42B72A",
          "green-dark": "#36A420",
          gray: "#F0F2F5",
          "gray-dark": "#606770",
          "gray-mid": "#BCC0C4",
          border: "#CED0D4",
          text: "#050505",
          "text-secondary": "#65676B",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
