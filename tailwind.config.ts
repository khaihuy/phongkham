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
        // Brand color — phong cách Long Châu (xanh dương đậm chủ đạo)
        brand: {
          50:  "#eef4ff",
          100: "#dbe7ff",
          200: "#bcd2ff",
          300: "#8db3ff",
          400: "#5a8cff",
          500: "#3066f4",
          600: "#1250DC",
          700: "#0e3eb0",
          800: "#0f3486",
          900: "#0f2d6c",
        },
        accent: {
          50:  "#fff1f1",
          100: "#ffdfdf",
          500: "#e03b3b",
          600: "#c61d1d",
        },
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        clinic: {
          blue: "#0EA5E9",
          lightBlue: "#E0F2FE",
          darkBlue: "#0369A1",
          green: "#10B981",
          yellow: "#F59E0B",
          red: "#EF4444",
          orange: "#F97316",
          purple: "#8B5CF6",
          gray: "#6B7280",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)",
        modal: "0 20px 60px -15px rgba(0,0,0,0.3)",
        product: "0 2px 8px rgba(0,0,0,0.04)",
      },
      maxWidth: {
        "8xl": "88rem",
      },
    },
  },
  plugins: [],
};

export default config;
