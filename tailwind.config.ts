import type { Config } from "tailwindcss";

// Couleurs de risque : utilisées par RiskCard, RiskBadge et DocumentViewer.
// Les valeurs sont provisoires ; la piste Interface peut les ajuster.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        risk: {
          critical: "#ef4444",
          warning: "#f97316",
          note: "#64748b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
