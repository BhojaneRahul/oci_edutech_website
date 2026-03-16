import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#FF8C00",
          secondary: "#FFC300"
        }
      },
      boxShadow: {
        soft: "0 20px 60px rgba(15, 23, 42, 0.12)"
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(circle at top left, rgba(255, 140, 0, 0.18), transparent 32%), radial-gradient(circle at top right, rgba(255, 195, 0, 0.18), transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,247,237,0.9))",
        "hero-mesh-dark":
          "radial-gradient(circle at top left, rgba(255, 140, 0, 0.22), transparent 28%), radial-gradient(circle at top right, rgba(255, 195, 0, 0.16), transparent 22%), linear-gradient(135deg, rgba(17,24,39,0.96), rgba(31,41,55,0.94))"
      }
    }
  },
  plugins: []
};

export default config;
