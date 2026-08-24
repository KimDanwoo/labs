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
 * 세그먼트보다 깊은 import 금지.
 * ui는 `ui`까지, model 하위는 `model/<세그먼트>`까지만 노출한다 — 그 아래 파일은 세그먼트 barrel(index.ts)로 감싼다.
 * `@views/x/XView`(메인 뷰 파일), 슬라이스 구조가 아닌 `@shared/**`, 테스트 픽스처는 대상이 아니다.
 * 같은 슬라이스 안에서의 상대경로 import는 내부 사정이라 막지 않는다.
 */
const SEGMENT_DEPTH_PATTERNS = [
  {
    group: [
      '@entities/*/ui/*',
      '@features/*/ui/*',
      '@widgets/*/ui/*',
      '@views/*/ui/*',
      '**/model/*/*',
      // 테스트 픽스처는 배럴을 만들 대상이 아니다.
      '!**/__tests__/**',
    ],
    message: 'ui는 ui까지, model은 model/<세그먼트>까지만 import한다. 세그먼트 barrel(index.ts)을 경유할 것.',
  },
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
      'no-restricted-imports': ['error', { patterns: SEGMENT_DEPTH_PATTERNS }],
    },
  },
  // 테스트는 대상 유닛을 직접 import하는 게 정상이다.
  {
    files: ['src/**/__tests__/**', 'src/**/*.{test,spec}.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },
];

export default eslintConfig;
