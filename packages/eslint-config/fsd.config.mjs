import typescriptParser from '@typescript-eslint/parser';
import { fsd } from 'my-fe-harness/eslint';
import labs from './rules/labs.mjs';

export const FSD_LAYOUT = { next: true, jotai: true, layers: { pages: 'views', widgets: false } };
const ROOT_FILES = ['app/**/*.{ts,tsx}', '*.{ts,tsx}'];

const RELATIVE_INTO_SRC = {
  regex: '^\\.{1,2}/(?:\\.\\./)*src(?:/|$)',
  message: 'src는 별칭 경로(@views/… 등)로 가져온다. app/ 안끼리의 상대경로는 그대로 둔다.',
};

const eslintConfig = [
  {
    files: ['src/**/*.{ts,tsx}', ...ROOT_FILES],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
  },
  ...fsd(FSD_LAYOUT),
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { labs },
    rules: { 'labs/interactive-composition': 'error' },
  },
  {
    files: ROOT_FILES,
    rules: { 'no-restricted-imports': ['error', { patterns: [RELATIVE_INTO_SRC] }] },
  },
];

export default eslintConfig;
