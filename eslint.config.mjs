import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "legacy/**",
      "var/**",
      "drizzle/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Async Server Components legitimately read the current time (dashboards,
      // "today", "last 30 days"); React 19's purity rule cannot distinguish
      // server components and false-positives on every `new Date()`/`Date.now()`
      // there. Rules-of-hooks and exhaustive-deps remain enforced.
      "react-hooks/purity": "off",
      // The cookie banner reads document.cookie once after mount to avoid a
      // hydration mismatch — a standard, safe pattern this rule over-flags.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
