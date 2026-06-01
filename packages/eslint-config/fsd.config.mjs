import typescriptParser from '@typescript-eslint/parser';
import boundaries from 'eslint-plugin-boundaries';

const FSD_ELEMENTS = [
  { type: 'app', pattern: 'src/app/**' },
  { type: 'views', pattern: 'src/views/**' },
  { type: 'widgets', pattern: 'src/widgets/**' },
  { type: 'features', pattern: 'src/features/**' },
  { type: 'entities', pattern: 'src/entities/**' },
  { type: 'shared', pattern: 'src/shared/**' },
];

// 상위 → 하위 단방향. 각 레이어가 import 가능한 하위 레이어 목록.
const DEPENDENCY_RULES = [
  { from: { type: 'app' }, allow: { to: { type: ['app', 'views', 'widgets', 'features', 'entities', 'shared'] } } },
  { from: { type: 'views' }, allow: { to: { type: ['widgets', 'features', 'entities', 'shared'] } } },
  { from: { type: 'widgets' }, allow: { to: { type: ['features', 'entities', 'shared'] } } },
  { from: { type: 'features' }, allow: { to: { type: ['entities', 'shared'] } } },
  { from: { type: 'entities' }, allow: { to: { type: ['shared'] } } },
  { from: { type: 'shared' }, allow: { to: { type: ['shared'] } } },
];

/**
 * FSD 레이어 경계 강제(eslint-plugin-boundaries v6).
 * app → views → widgets → features → entities → shared (상위는 하위만 import 가능).
 * node_modules/워크스페이스 패키지(@ui/react 등)는 element가 아니므로 이 규칙의 대상이 아니다.
 */
const eslintConfig = [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: { boundaries },
    settings: {
      'boundaries/elements': FSD_ELEMENTS,
      'boundaries/include': ['src/**/*.*'],
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: './tsconfig.json' },
      },
    },
    rules: {
      'boundaries/dependencies': ['error', { default: 'disallow', rules: DEPENDENCY_RULES }],
    },
  },
];

export default eslintConfig;
