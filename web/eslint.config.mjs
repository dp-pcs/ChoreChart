import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/build/**",
      "**/dist/**",
      "**/out/**",
      "**/.vercel/**",
      "**/src/generated/**",
      "**/prisma/migrations/**",
      "**/*.wasm.js",
      "**/*wasm*.js",
      "**/*.min.js",
      "**/*.config.js",
      "**/*.config.ts",
      "next.config.ts",
      "next.config.js",
      "tailwind.config.js",
      "postcss.config.js",
      "metro.config.js"
    ]
  }
];

export default eslintConfig;
