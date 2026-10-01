import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // カスタムドメイン japan-foreigners-workers.visualizing.jp はサイトのルート。
  base: "/",
  build: { outDir: "dist", assetsDir: "assets" },
  server: { host: "127.0.0.1", port: 5185, strictPort: true },
});
