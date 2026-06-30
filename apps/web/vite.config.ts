import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const root = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@vendo/shared": path.resolve(root, "packages/shared/src/index.ts"),
      "@vendo/forms": path.resolve(root, "packages/forms/src/index.ts"),
      "@jal/docs": path.resolve(root, "docs"),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [root],
    },
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
