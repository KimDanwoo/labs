// my-fe-harness 기본 잠금(scripts/lint-guard-baseline.mjs)과 같은 값이다. 훅은 Claude가 고친 파일만 보므로,
// 사람이 쓴 코드와 CI도 같은 기준을 받도록 저장소 lint에 둔다. 기존 위반은 앱별 eslint-suppressions.json에 묶여 있고 줄어들기만 한다.
const MAX_COMPLEXITY = 10;
const MAX_DEPTH = 3;
const MAX_FUNCTION_LINES = 120;
const MAX_COMPONENT_FILE_LINES = 250;
const ALLOWED_NUMBERS = [-1, 0, 1, 2, 100];
const LENGTH_OPTIONS = { skipBlankLines: true, skipComments: true };

const SOURCE_FILES = ['**/*.{js,jsx,ts,tsx}'];
const COMPONENT_FILES = ['**/*.{jsx,tsx}'];
const COMPONENTS_AND_HOOKS = ['**/*.{jsx,tsx}', '**/use[A-Z]*.{js,ts}'];
const NUMBER_HOMES = ['**/config/**', '**/constants/**', '**/constants.*', '**/*.config.*'];
const TESTS = ['**/__tests__/**', '**/*.test.*', '**/*.spec.*', '**/e2e/**'];

const MAGIC_NUMBERS = '@typescript-eslint/no-magic-numbers';

const qualityConfig = [
  {
    files: SOURCE_FILES,
    rules: {
      complexity: ['error', MAX_COMPLEXITY],
      'max-depth': ['error', MAX_DEPTH],
      'max-lines-per-function': ['error', { max: MAX_FUNCTION_LINES, ...LENGTH_OPTIONS }],
    },
  },
  {
    files: COMPONENT_FILES,
    rules: { 'max-lines': ['error', { max: MAX_COMPONENT_FILE_LINES, ...LENGTH_OPTIONS }] },
  },
  {
    files: COMPONENTS_AND_HOOKS,
    rules: {
      [MAGIC_NUMBERS]: [
        'error',
        {
          ignore: ALLOWED_NUMBERS,
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          ignoreClassFieldInitialValues: true,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],
    },
  },
  { files: NUMBER_HOMES, rules: { [MAGIC_NUMBERS]: 'off' } },
  { files: TESTS, rules: { [MAGIC_NUMBERS]: 'off', 'max-lines-per-function': 'off' } },
];

export default qualityConfig;
