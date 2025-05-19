import { defineConfig } from "vite";

export default defineConfig({
  base: "/hood-ball/",
  esbuild: {
    keepNames: true,
  },
});
