module.exports = {
  env: {
    es2020: true,
    jest: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: "eslint:recommended",
  rules: {
    "@typescript-eslint/explicit-function-return-type": [
      "error",
      {
        allowExpressions: true,
      },
    ],
    "@typescript-eslint/no-require-imports": "error",
    "no-alert": "warn",
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "warn",
    "no-dupe-else-if": "warn",
    "no-unused-expressions": "warn",
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-useless-call": "warn",
    "no-useless-computed-key": "warn",
    "no-useless-concat": "warn",
    "no-useless-rename": "warn",
    "no-useless-return": "warn",
    "no-var": "error",
    "object-shorthand": ["warn", "properties"],
    "prefer-arrow-callback": "error",
    "prefer-const": "error",
    "sort-imports": "warn",
  },
  overrides: [
    {
      files: ["gulpfile.js", "src/bin/*"],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-require-imports": "off",
      },
    },
  ],
};
