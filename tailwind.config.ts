/*
Author: Domonick Mack
Date: 2026-11-15
Description: Tailwind CSS configuration with custom Linear/Attio SaaS theme tokens and TikTok brand accents.
*/

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        tiktok: {
          cyan: "#25F4EE",
          rose: "#FE2C55",
          dark: "#090A0F",
          surface: "#11131A",
          border: "#1F2230",
          muted: "#8A90A6"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
