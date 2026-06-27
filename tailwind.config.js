/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        pitch: "#0d2117",
        crease: "#f6b73c",
        floodlight: "#f7f4ec",
        graphite: "#161b20",
        turf: "#2f8f5b",
        scoreboard: "#102a43"
      },
      boxShadow: {
        lift: "0 18px 50px rgba(12, 22, 18, 0.16)"
      }
    }
  },
  plugins: []
};
