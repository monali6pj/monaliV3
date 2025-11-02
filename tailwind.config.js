
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {50:"#f0fdfa",100:"#ccfbf1",200:"#99f6e4",300:"#5eead4",400:"#2dd4bf",500:"#14b8a6",600:"#0d9488",700:"#0f766e",800:"#115e59",900:"#134e4a"}
      },
      boxShadow: { soft: "0 10px 30px rgba(0,0,0,0.25)" },
      borderRadius: { xxl: "1.5rem" }
    }
  },
  plugins: []
};
