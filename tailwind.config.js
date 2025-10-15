/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
 theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"], // clean modern font
      },
      colors: {
        primary: {
          DEFAULT: "#0d819bff", // deep blue
          light: "#3B82F6",  // Tailwind blue
          dark: "#1E40AF",
        },
        secondary: {
          DEFAULT: "#F59E0B", // amber for accents
        },
        neutral: {
          light: "#F9FAFB",
          DEFAULT: "#6B7280",
          dark: "#111827",
        },
      },
      boxShadow: {
        card: "0 4px 12px rgba(0, 0, 0, 0.1)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
}
