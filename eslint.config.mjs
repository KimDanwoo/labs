import quality from '@repo/eslint-config/quality.config.mjs';
import typescriptParser from '@typescript-eslint/parser';

const eslintConfig = [
  { ignores: ['apps/**', '**/dist/**', '**/.turbo/**'] },
  { files: ['**/*.{ts,mts,cts}'], languageOptions: { parser: typescriptParser } },
  {
    rules: {
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-nested-ternary': 'error',
    },
  },
  ...quality(),
];

export default eslintConfig;
