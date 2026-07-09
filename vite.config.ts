import { defineConfig } from "vite";
import path from "path";

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
  plugins: [
    // Fixes a packaging filename mismatch in @mori2003/jsimgui v0.14.0
    // The distributed imgui.js imports "./loader-freetype-extensions.js"
    // but the package contains "loader-extensions-freetype.js". This
    // plugin resolves the wrong specifier to the correct file at build time.
    {
      name: "fix-jsimgui-loader-import",
      enforce: "pre",
      resolveId(source, importer) {
        try {
          if (
            source === "./loader-freetype-extensions.js" &&
            typeof importer === "string" &&
            importer.includes(path.join("node_modules", "@mori2003", "jsimgui", "build", "imgui.js"))
          ) {
            return path.resolve(path.dirname(importer), "loader-extensions-freetype.js");
          }
        } catch (e) {
          // swallow
        }
        return null;
      },
      transform(code, id) {
        if (typeof id === "string" && id.includes(path.join("node_modules", "@mori2003", "jsimgui", "build", "imgui.js"))) {
          return code.replace("./loader-freetype-extensions.js", "./loader-extensions-freetype.js");
        }
      },
    },
  ],
});
