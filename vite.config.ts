import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@engine": fileURLToPath(new URL("./packages/engine/src", import.meta.url)),
      "@game": fileURLToPath(new URL("./packages/game/src", import.meta.url)),
    },
  },
  server: {
    open: "http://localhost:5173",
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  esbuild: {
    keepNames: true,
  },
});

