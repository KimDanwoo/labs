import typescriptParser from '@typescript-eslint/parser';
import boundaries from 'eslint-plugin-boundaries';
import architecture from './rules/architecture.mjs';

const FSD_ELEMENTS = [
  { type: 'app', pattern: 'src/app/**' },
  { type: 'views', pattern: 'src/views/**' },
  { type: 'widgets', pattern: 'src/widgets/**' },
  { type: 'features', pattern: 'src/features/**' },
  { type: 'entities', pattern: 'src/entities/**' },
  { type: 'shared', pattern: 'src/shared/**' },
];

// 상위 → 하위 단방향. 각 레이어가 import 가능한 하위 레이어 목록.
// eslint-plugin-boundaries v7 policies 문법(구 `rules` 옵션은 deprecated).
const DEPENDENCY_POLICIES = [
  {
    from: { element: { type: 'app' } },
    allow: { to: { element: { types: { anyOf: ['app', 'views', 'widgets', 'features', 'entities', 'shared'] } } } },
  },
  {
    from: { element: { type: 'views' } },
    allow: { to: { element: { types: { anyOf: ['widgets', 'features', 'entities', 'shared'] } } } },
  },
  {
    from: { element: { type: 'widgets' } },
    allow: { to: { element: { types: { anyOf: ['features', 'entities', 'shared'] } } } },
  },
  { from: { element: { type: 'features' } }, allow: { to: { element: { types: { anyOf: ['entities', 'shared'] } } } } },
  { from: { element: { type: 'entities' } }, allow: { to: { element: { type: 'shared' } } } },
  { from: { element: { type: 'shared' } }, allow: { to: { element: { type: 'shared' } } } },
];

/**
 * FSD 레이어 경계 강제(eslint-plugin-boundaries v7).
 * app → views → widgets → features → entities → shared (상위는 하위만 import 가능).
 * node_modules/워크스페이스 패키지(@ui/react 등)는 element가 아니므로 이 규칙의 대상이 아니다.
 */
const LANGUAGE_OPTIONS = {
  parser: typescriptParser,
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
};

const eslintConfig = [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: LANGUAGE_OPTIONS,
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
      'fsd/independent-slices': 'error',
      'fsd/public-api': 'error',
      'fsd/component-file': 'error',
      'fsd/routing-location': 'error',
      'fsd/entity-state': 'error',
      'fsd/interactive-composition': 'error',
    },
  },
  // 루트 app/(Next 라우팅)도 슬라이스를 공개 API로만 가져온다.
  {
    files: ['app/**/*.{ts,tsx}'],
    languageOptions: LANGUAGE_OPTIONS,
    plugins: { fsd: architecture },
    rules: { 'fsd/public-api': 'error' },
  },
];

export default eslintConfig;
