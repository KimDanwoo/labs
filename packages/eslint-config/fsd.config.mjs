import typescriptParser from '@typescript-eslint/parser';
import boundaries from 'eslint-plugin-boundaries';
import architecture from './rules/architecture.mjs';

const FSD_ELEMENTS = [
  { type: 'app', pattern: 'src/app/**' },
  { type: 'views', pattern: 'src/views/**' },
  { type: 'features', pattern: 'src/features/**' },
  { type: 'entities', pattern: 'src/entities/**' },
  { type: 'shared', pattern: 'src/shared/**' },
];

// eslint-plugin-boundaries v7 policies 문법(구 `rules` 옵션은 deprecated).
const DEPENDENCY_POLICIES = [
  {
    from: { element: { type: 'app' } },
    allow: { to: { element: { types: { anyOf: ['app', 'views', 'features', 'entities', 'shared'] } } } },
  },
  {
    from: { element: { type: 'views' } },
    allow: { to: { element: { types: { anyOf: ['features', 'entities', 'shared'] } } } },
  },
  { from: { element: { type: 'features' } }, allow: { to: { element: { types: { anyOf: ['entities', 'shared'] } } } } },
  { from: { element: { type: 'entities' } }, allow: { to: { element: { type: 'shared' } } } },
  { from: { element: { type: 'shared' } }, allow: { to: { element: { type: 'shared' } } } },
];

const eslintConfig = [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: { boundaries, fsd: architecture },
    settings: {
      'boundaries/elements': FSD_ELEMENTS,
      'boundaries/include': ['src/**/*.*'],
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: './tsconfig.json' },
      },
    },
    rules: {
      'boundaries/dependencies': ['error', { default: 'disallow', policies: DEPENDENCY_POLICIES }],
      'fsd/slice-structure': 'error',
      'fsd/public-api': 'error',
      'fsd/independent-slices': 'error',
      'fsd/component-file': 'error',
      'fsd/routing-location': 'error',
      'fsd/entity-state': 'error',
      'fsd/interactive-composition': 'error',
    },
  },
  // 루트 라우팅(app/)과 proxy 등 src 밖 파일도 슬라이스는 공개 API로만 가져온다.
  {
    files: ['app/**/*.{ts,tsx}', '*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: { fsd: architecture },
    rules: { 'fsd/public-api': 'error' },
  },
];

export default eslintConfig;
