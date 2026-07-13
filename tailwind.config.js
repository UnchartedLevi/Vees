/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: "#F7F4FF",
          "bg-elevated": "#FBFBFD",
          text: "#1F1D34",
          "text-secondary": "#76728B",
          "text-tertiary": "#8D88A1",
          blue: "#7C5CFF",
          "blue-hover": "#6F4EFF",
          "blue-pressed": "#6B48F2",
          separator: "#E4DEFA",
          fill: "#F7F4FF",
          "fill-secondary": "#EBEBEB",
          "fill-tertiary": "#E1E1E6",
        },
        vees: {
          ink: "#19182D",
          panel: "#302F57",
          violet: "#9F83FF",
          lavender: "#C8BAFF",
          pink: "#F6A6D5",
          mist: "#F7F4FF",
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
