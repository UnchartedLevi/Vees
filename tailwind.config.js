/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: "#F5F5F7",
          "bg-elevated": "#FBFBFD",
          text: "#1D1D1F",
          "text-secondary": "#6E6E73",
          "text-tertiary": "#86868B",
          blue: "#0071E3",
          "blue-hover": "#0077ED",
          "blue-pressed": "#006EDB",
          separator: "#E8E8ED",
          fill: "#F5F5F7",
          "fill-secondary": "#EBEBEB",
          "fill-tertiary": "#E1E1E6",
        },
      },
      boxShadow: {
        card: "0 1px 1px rgba(0,0,0,0.02), 0 2px 8px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        "card-raised": "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        header: "0 1px 0 rgba(0,0,0,0.06)",
      },
      borderRadius: {
        apple: "18px",
        "apple-sm": "12px",
        "apple-xs": "8px",
        "apple-pill": "980px",
      },
      fontFamily: {
        apple: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
    },
  },
  plugins: [],
};
