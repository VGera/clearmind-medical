import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm paper ground, deep slate-blue primary: calm, clinical, low-arousal
        paper: "#f6f5f1",
        panel: "#ffffff",
        ink: "#1e2a33",
        muted: "#5c6b75",
        // Was #8a979f — 2.75:1 on paper, below AA. Tertiary rank is carried by
        // size and weight instead; there is no lighter grey that passes here.
        faint: "#5c6b75",
        line: "#e3e0d8",
        slate: {
          50: "#eef3f5",
          100: "#dde8ec",
          200: "#b9ced7",
          300: "#8fb0bd",
          500: "#2d5468",
          600: "#244557",
          700: "#1b3543",
        },
        sage: { 100: "#e6efe8", 500: "#5f8871", 600: "#4c7159" },
        clay: { 100: "#f6ece4", 500: "#b9764f", 600: "#8a5436" },
        alert: { 100: "#f7e9e7", 500: "#a4433b" },
        /* Soft tints for the acquisition surfaces. Every pairing below is
           dark-on-pastel, so all of them clear AA comfortably. */
        tint: {
          lilac: "#ece8f7", lilacInk: "#4a3f6e",
          apricot: "#fbeade", apricotInk: "#8a5331",
          mint: "#e2f0e9", mintInk: "#2f6b52",
          sky: "#e3eef8", skyInk: "#2c5578",
          blush: "#fae9ea", blushInk: "#8a3f49",
          sand: "#f7eedd", sandInk: "#7a5a2a",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        serif: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(30,42,51,0.04), 0 6px 20px rgba(30,42,51,0.06)",
        lift: "0 2px 4px rgba(30,42,51,0.06), 0 14px 36px rgba(30,42,51,0.10)",
      },
      borderRadius: { xl2: "1.125rem" },
    },
  },
  plugins: [],
};
export default config;
