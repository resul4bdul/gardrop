import type { Config } from "tailwindcss";

// gardrop.html-dəki tailwind.config ilə birə-bir eyni (CDN config → build config).
export default {
  content: ["./*.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["'SF Pro Display'", "'SF Pro'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
      },
      colors: {
        brand: "#0A0A0A",
        "brand-h": "#1F1F1F",
        accent: "#69EA9B",
        "accent-t": "#0A4020",
        "accent-d": "#0A3020",
        bg2: "#F7F7F7",
        bg3: "#EFEFEF",
        bdr: "#E0E0E0",
        "bdr-s": "#C2C2C2",
        t2: "#757575",
        t3: "#9E9E9E",
        td: "#C2C2C2",
        sale: "#E53E3E",
        // admin/magaza panellərinin əlavə rəngləri.
        // QEYD: bare `blue`/`amber` (DEFAULT) köhnə panellər üçün; nömrəli şkala (50..700) merchant dizaynı üçün.
        // Brend rəngi ELEGANT DƏRİN EMERALD (#0B8457). `blue` adı + `emerald` override eyni şkalaya bağlı
        // ki köhnə `text-blue`/`bg-blue` + merchant `emerald-*` hamısı bu tona düşsün (class adları sınmır).
        // Kifayət qədər tünddür → ağ yazı kontrastı yaxşıdır.
        blue: { DEFAULT: "#0B8457", 50: "#ECFDF5", 100: "#D1FAE5", 500: "#12B886", 600: "#0B8457", 700: "#086B46" },
        emerald: { DEFAULT: "#0B8457", 50: "#ECFDF5", 100: "#D1FAE5", 500: "#12B886", 600: "#0B8457", 700: "#086B46" },
        amber: { DEFAULT: "#E8A317", 50: "#FFFBEB", 100: "#FEF3C7", 500: "#F59E0B", 700: "#B45309", 800: "#92400E" },
        green: "#16A34A",
      },
      borderRadius: { badge: "4px", btn: "10px", card: "14px", sheet: "18px", sheet2: "24px" },
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,0.06)",
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
        "card-h": "0 12px 32px rgba(0,0,0,0.12)",
        pop: "0 20px 60px rgba(0,0,0,0.18)",
      },
    },
  },
  plugins: [],
} satisfies Config;
