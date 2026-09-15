import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        deep: "#071C28",
        tide: "#134E5A",
        aqua: "#2A8A8F",
        foam: "#D9EFEC",
        pearl: "#F4F0E6",
        gold: "#C4A046",
        ink: "#14242B",
        mist: "#5E737A",
        clay: "#C46B6B",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 50px rgba(7, 28, 40, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
