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
  {
    /**
     * 세그먼트를 넘는 상대경로 금지. `../model`은 파일이 깊어지면 같이 깨지지만 `@views/study/model`은 안 깨진다.
     * 같은 폴더 형제(`./X`)는 그대로 둔다 — alias로 바꾸면 자기 세그먼트 배럴을 자기가 import하는 순환이 된다.
     */
    group: ['../*', '../**'],
    message: '세그먼트를 넘는 import는 @alias를 쓴다(예: ../model → @views/study/model). 같은 폴더는 ./로 참조.',
  },
];

/**
 * FSD 레이어 경계 강제(eslint-plugin-boundaries v7).
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
      'fsd/component-file': 'error',
      'fsd/routing-location': 'error',
      'fsd/entity-state': 'error',
      'fsd/interactive-composition': 'error',
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
