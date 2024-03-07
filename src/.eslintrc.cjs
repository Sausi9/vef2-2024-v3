module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    '@typescript-eslint/no-unused-vars': 'error', // Enforce reporting unused variables
    '@typescript-eslint/no-explicit-any': 'off', // Allow explicit 'any' types
  },
};
