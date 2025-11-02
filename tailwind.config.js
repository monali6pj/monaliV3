/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#14b8a6"
        }
      },
      boxShadow: { soft: "0 10px 30px rgba(0,0,0,0.25)" },
      borderRadius: { xxl: "1.5rem" }
    }
  },
  plugins: []
};
