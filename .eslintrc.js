module.exports = {
  env: {
    es6: true,
    node: true
  },
  extends: "eslint:recommended",
  rules: {
    "linebreak-style": ["error", "unix"],
    "no-alert": "warn",
    "no-console": "warn",
    "no-debugger": "warn",
    "no-var": "error",
    "prefer-const": "error",
    semi: ["error", "always"]
  }
};
