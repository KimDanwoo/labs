import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import namingConfig from './naming.config.mjs';
import quality from './quality.config.mjs';

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  ...namingConfig,
  ...quality([...nextVitals, ...nextTs]),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      'prettier/prettier': 'error',
      'no-console': ['error', { allow: ['error', 'warn'] }],
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
  {
    files: ['scripts/**'],
    rules: { 'no-console': 'off' },
  },
  eslintConfigPrettier,
];

export default eslintConfig;
