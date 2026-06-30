import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Build çıxışı + gardrop.html-dən birə-bir köçürülmüş (vendored) app — lint/format-dan kənar.
    // Bu fayl @ts-nocheck-dir və qəsdən toxunulmaz saxlanılır (dizayn 1:1 port).
    ignores: [
      "dist",
      "src/app/GardropApp.tsx",
      "src/admin/AdminApp.tsx",
      "src/magaza/MagazaApp.tsx",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
);
