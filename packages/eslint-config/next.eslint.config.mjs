import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import namingConfig from './naming.config.mjs';

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  // nextTs가 @typescript-eslint 플러그인을 등록한 뒤여야 한다.
  ...namingConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      'prettier/prettier': 'error',
      // console.log만 막는다. error/warn은 삼킨 에러를 드러내는 유일한 신호다.
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
  // CLI 스크립트는 콘솔 출력이 결과물이다.
  {
    files: ['scripts/**'],
    rules: { 'no-console': 'off' },
  },
  // 항상 마지막: Prettier와 충돌하는 ESLint 포맷 규칙 비활성화.
  eslintConfigPrettier,
];

export default eslintConfig;
