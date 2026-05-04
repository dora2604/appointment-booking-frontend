/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefaf7",
          100: "#d6f3eb",
          500: "#109d78",
          700: "#0b6c53",
          900: "#073f31"
        },
        accent: {
          500: "#f59e0b",
          700: "#b45309"
        }
      },
      boxShadow: {
        soft: "0 10px 30px -15px rgba(16, 157, 120, 0.4)"
      }
    }
  },
  plugins: []
};
