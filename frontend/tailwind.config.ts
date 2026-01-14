import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0F766E",
          muted: "#0B4F48",
          light: "#0FB5A2",
        },
      },
      boxShadow: {
        card: "0 10px 40px -18px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
