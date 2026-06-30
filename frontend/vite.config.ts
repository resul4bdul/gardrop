import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  // classic JSX runtime: gardrop.html-in i18n qatı React.createElement-i
  // override edir; yalnız classic runtime-da bu override JSX-ə tətbiq olunur.
  plugins: [react({ jsxRuntime: "classic" })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Çoxsəhifəli (MPA): hər panel ayrıca giriş nöqtəsidir.
  //   /          → index.html   (müştəri saytı, GardropApp)
  //   /admin.html  → admin paneli (AdminApp)
  //   /magaza.html → satıcı paneli (MagazaApp)
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        admin: path.resolve(__dirname, "admin.html"),
        magaza: path.resolve(__dirname, "magaza.html"),
      },
    },
  },
  // @ts-expect-error — vitest "test" sahəsini Vite tipi tanımır, runtime-da vitest oxuyur
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Yalnız unit/komponent (.test.*); Playwright e2e (e2e/*.spec.ts) vitest-dən kənar.
    include: ["src/**/*.test.{ts,tsx}"],
  },
  server: {
  port: 5173,
  allowedHosts: true,
  proxy: {
    "/api": {
      target: "http://localhost:3001",
      changeOrigin: true,
    },
    "/uploads": {
      target: "http://localhost:3001",
      changeOrigin: true,
    },
  },
},
});
