import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

const engineSource = fileURLToPath(new URL("../engine/src", import.meta.url));
const gameSource = fileURLToPath(new URL("./src", import.meta.url));
const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  envDir: workspaceRoot,
  resolve: {
    alias: {
      "@engine": engineSource,
      "@game": gameSource,
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
