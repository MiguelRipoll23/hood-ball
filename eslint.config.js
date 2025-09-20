import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.ts"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/engine/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "../game/*",
                "../../game/*",
                "../../../game/*",
                "../../../../game/*",
                "../../../../../game/*"
              ],
              message: "Engine layer must not depend on game code.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "ExportNamedDeclaration > FunctionDeclaration[id.name='initialize']",
          message:
            "Do not export functions named initialize; wire collaborators through constructors or dedicated factories.",
        },
        {
          selector:
            "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name='initialize']",
          message:
            "Do not export initialize bindings; prefer explicit constructors or start methods.",
        },
        {
          selector:
            "ExportSpecifier[exported.name='initialize']",
          message:
            "Avoid re-exporting initialize functions; use explicit bootstrap modules instead.",
        },
      ],
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
];
