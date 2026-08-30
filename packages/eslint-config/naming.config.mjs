/**
 * 네이밍 규약 강제(flat).
 * 식별자는 @typescript-eslint/naming-convention이, 파일·디렉토리명은 자체 룰이 본다.
 * `@typescript-eslint` 플러그인은 eslint-config-next/typescript가 이미 등록하므로 여기선 룰만 참조한다.
 */

const PASCAL_CASE = /^[A-Z][a-zA-Z0-9]*$/;
const CAMEL_CASE = /^[a-z][a-zA-Z0-9]*$/;
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HOOK_NAME = /^use[A-Z]/;

// Next가 이름을 소유하는 라우팅·메타데이터 파일.
const ROUTE_FILE =
  /^(page|layout|route|error|loading|not-found|global-error|template|default|icon|apple-icon|opengraph-image|twitter-image|sitemap|robots|manifest)$/;

// 라우트 그룹 `(main)`, 동적 세그먼트 `[id]`, 프라이빗 `_ui`, `__tests__`, `@types`는 케이스 규약 밖이다.
const EXEMPT_DIR = /^[[(_@]|^__/;

const filenameCase = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    return {
      Program(node) {
        const segments = context.filename.split('/');
        const base = segments.pop().split('.')[0];
        if (base === 'index' || ROUTE_FILE.test(base)) return;

        // 훅은 JSX를 담아 .tsx여도 camelCase다.
        const isComponent = context.filename.endsWith('.tsx') && !HOOK_NAME.test(base);
        if (!(isComponent ? PASCAL_CASE : CAMEL_CASE).test(base)) {
          context.report({ node, message: `파일명은 ${isComponent ? 'PascalCase' : 'camelCase'}여야 한다: ${base}` });
        }

        const srcIndex = segments.indexOf('src');
        if (srcIndex === -1) return;
        const badDir = segments.slice(srcIndex + 1).find((dir) => !KEBAB_CASE.test(dir) && !EXEMPT_DIR.test(dir));
        if (badDir) context.report({ node, message: `디렉토리는 kebab-case여야 한다: ${badDir}` });
      },
    };
  },
};

const eslintConfig = [
  {
    // src 밖(루트 app/ 라우팅, scripts/, 설정 파일)은 대상이 아니다.
    files: ['src/**/*.{ts,tsx}'],
    plugins: { naming: { rules: { 'filename-case': filenameCase } } },
    rules: {
      'naming/filename-case': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'typeLike', format: ['PascalCase'] },
        // 컴포넌트도 함수라 PascalCase를 함께 허용한다.
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'], leadingUnderscore: 'allow' },
        // 컴포넌트를 값으로 받는 파라미터(`{ Icon }`)가 있어 PascalCase를 함께 허용한다.
        { selector: 'parameter', format: ['camelCase', 'PascalCase'], leadingUnderscore: 'allow' },
        // API 응답·서드파티 옵션 키는 통제 밖이다.
        { selector: 'objectLiteralProperty', format: null },
      ],
    },
  },
];

export default eslintConfig;
