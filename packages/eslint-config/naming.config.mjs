const PASCAL_CASE = /^[A-Z][a-zA-Z0-9]*$/;
const CAMEL_CASE = /^[a-z][a-zA-Z0-9]*$/;
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HOOK_NAME = /^use[A-Z]/;
const COMPONENT_STYLES = /\.styles\.ts$/;

const ROUTE_FILE =
  /^(page|layout|route|error|loading|not-found|global-error|template|default|icon|apple-icon|opengraph-image|twitter-image|sitemap|robots|manifest)$/;

const EXEMPT_DIR = /^[[(_@]|^__/;

const filenameCase = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    return {
      Program(node) {
        const segments = context.filename.split('/');
        const base = segments.pop().split('.')[0];
        const isFrameworkName = base === 'index' || ROUTE_FILE.test(base);
        if (isFrameworkName) return;

        const isComponent =
          (context.filename.endsWith('.tsx') && !HOOK_NAME.test(base)) || COMPONENT_STYLES.test(context.filename);
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
    files: ['src/**/*.{ts,tsx}'],
    plugins: { naming: { rules: { 'filename-case': filenameCase } } },
    rules: {
      'naming/filename-case': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'], leadingUnderscore: 'allow' },
        { selector: 'parameter', format: ['camelCase', 'PascalCase'], leadingUnderscore: 'allow' },
        { selector: 'objectLiteralProperty', format: null },
      ],
    },
  },
];

export default eslintConfig;
