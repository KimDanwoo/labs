import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';

/**
 * Next 앱 공통 ESLint(flat, ESLint 9 네이티브).
 * - 포맷은 Prettier가 담당한다. eslint-config-prettier가 충돌하는 포맷 규칙(quotes/indent/max-len 등)을 끈다.
 * - ESLint는 의미 규칙만 본다.
 */
const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      'prettier/prettier': 'error',
      'no-console': 'error',
      'no-use-before-define': ['error', { functions: false }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
      'consistent-return': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'no-duplicate-imports': 'error',
      'prefer-template': 'error',
      'no-nested-ternary': 'error',
      'spaced-comment': ['error', 'always', { exceptions: ['-', '+'] }],
    },
  },
  // 항상 마지막: Prettier와 충돌하는 ESLint 포맷 규칙 비활성화.
  eslintConfigPrettier,
];

export default eslintConfig;
