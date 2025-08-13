import { defineConfig } from "vite";

export default defineConfig({
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
