import typescriptParser from '@typescript-eslint/parser';
import { fsd } from 'my-fe-harness/eslint';
import labs from './rules/labs.mjs';

// labs는 FSD pages 레이어를 views로 부른다(Next 라우팅 app/과 이름이 겹치지 않게). widgets는 쓰지 않는다.
export const FSD_LAYOUT = { next: true, jotai: true, layers: { pages: 'views', widgets: false } };
const ROOT_FILES = ['app/**/*.{ts,tsx}', '*.{ts,tsx}'];

// harness/no-relative-import는 별칭 범위(src/) 안의 파일만 본다. 루트 app/·루트 파일이 상대경로로 src를 가져오는 것은 여기서 막는다.
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
