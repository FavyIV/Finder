// eslint.config.cjs — CommonJS flat config for ESLint 9 (backend is CJS, no "type":"module")
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  { ignores: ['dist', 'node_modules', 'prisma/migrations', 'eslint.config.cjs'] },
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowHigherOrderFunctions: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
