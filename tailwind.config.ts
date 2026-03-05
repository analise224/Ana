import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bq-bg': '#07090F',
        'bq-card': '#0C1220',
        'bq-purple': '#7C3AED',
        'bq-teal': '#0EC4A8',
        'bq-amber': '#F5A623',
        'bq-green': '#10C97E',
        'bq-red': '#F04060',
        'bq-border': '#1E2A3A',
      },
    },
  },
  plugins: [],
};
export default config;
