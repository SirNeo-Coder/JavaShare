import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "backend/dist/**",
    ".open-next/**",
    ".wrangler/**",
    "next-env.d.ts",
    // The teacher's module files and checker tools, not CodeShare's own code (teacher, 2026-11-24).
    "docs/modules/**",
  ]),
]);

export default eslintConfig;
