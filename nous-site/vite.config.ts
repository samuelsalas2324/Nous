import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Las fuentes se sirven como archivos propios (font-src 'self' en la CSP); no se incrustan como data: URI.
  build: { assetsInlineLimit: 0 },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
