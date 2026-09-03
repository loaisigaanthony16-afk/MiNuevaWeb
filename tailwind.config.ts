import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "var(--font-inter)", "sans-serif"],
      },
      colors: {
        // Escala de negros/grises de la interfaz oscura.
        ink: {
          950: "#050506",
          900: "#0A0A0B",
          850: "#0E0E10",
          800: "#141416",
          700: "#1C1C1F",
          600: "#2A2A2E",
          500: "#3D3D43",
          400: "#6B6B73",
          300: "#9A9AA2",
          200: "#C7C7CD",
          100: "#E6E6EA",
          50: "#F5F5F7",
        },
        // Dorado de marca: hairlines, kickers y detalles.
        gold: {
          100: "#F6EDD6",
          200: "#EBDAAF",
          300: "#DCC183",
          400: "#C9A758",
          500: "#B08D3E",
          600: "#8A6E2F",
        },
        // Líneas de producto.
        melted: "#F2A8CB",
        live: "#D9DEE4",
        rosin: "#6FC8BE",
        distillate: "#D9B978",
        // Cepas.
        sativa: "#E2872F",
        indica: "#7B4FBF",
        hybrid: "#2E9E6B",
      },
      // Pasos de opacidad finos para hairlines sobre fondo oscuro.
      opacity: {
        4: "0.04",
        6: "0.06",
        8: "0.08",
        12: "0.12",
        14: "0.14",
        16: "0.16",
        18: "0.18",
        22: "0.22",
        35: "0.35",
      },
      borderRadius: {
        card: "16px",
        xl2: "22px",
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 18px 40px -24px rgba(0,0,0,0.9)",
        lift: "0 1px 0 rgba(255,255,255,0.06) inset, 0 32px 70px -30px rgba(0,0,0,1)",
        pop: "0 40px 100px -30px rgba(0,0,0,1)",
        glow: "0 0 0 1px rgba(201,167,88,0.28), 0 20px 60px -30px rgba(201,167,88,0.5)",
      },
      letterSpacing: {
        tightest: "-0.04em",
        wide2: "0.18em",
        wide3: "0.28em",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(0,-18px,0) scale(1.06)" },
        },
        sheen: {
          from: { transform: "translateX(-120%)" },
          to: { transform: "translateX(220%)" },
        },
        slideIn: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        rise: "rise 0.7s cubic-bezier(0.22,1,0.36,1) both",
        marquee: "marquee 38s linear infinite",
        drift: "drift 14s ease-in-out infinite",
        sheen: "sheen 1.1s cubic-bezier(0.22,1,0.36,1)",
        slideIn: "slideIn 0.42s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
