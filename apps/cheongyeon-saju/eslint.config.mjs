import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import-x';
import prettierPlugin from 'eslint-plugin-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

const FSD_LAYERS = [
  'app',
  'views',
  'widgets',
  'features',
  'entities',
  'shared',
];

const fsdImportOrder = FSD_LAYERS.map((layer) => ({
  group: [`@${layer}`, `@${layer}/**`],
}));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'eslint.config.mjs',
  ]),
  {
    plugins: {
      prettier: prettierPlugin,
      'import-x': importPlugin,
    },
    rules: {
      'prettier/prettier': 'error',

      // Import 정렬
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          pathGroups: [
            { pattern: 'react', group: 'builtin', position: 'before' },
            { pattern: 'next/**', group: 'builtin', position: 'before' },
            ...fsdImportOrder.map(({ group }) => ({
              pattern: group[0],
              group: 'internal',
              position: 'before',
            })),
            ...fsdImportOrder.map(({ group }) => ({
              pattern: group[1],
              group: 'internal',
              position: 'before',
            })),
          ],
          pathGroupsExcludedImportTypes: ['react', 'next'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-duplicates': 'error',
      'import-x/newline-after-import': 'error',

      // FSD 레이어 의존성 규칙 (상위 → 하위만 허용)
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            // shared는 다른 레이어를 import할 수 없음
            {
              target: './src/shared/**',
              from: './src/{entities,features,widgets,views,app}/**',
            },
            // entities는 features 이상을 import할 수 없음
            {
              target: './src/entities/**',
              from: './src/{features,widgets,views,app}/**',
            },
            // features는 widgets 이상을 import할 수 없음
            {
              target: './src/features/**',
              from: './src/{widgets,views,app}/**',
            },
            // widgets는 views 이상을 import할 수 없음
            {
              target: './src/widgets/**',
              from: './src/{views,app}/**',
            },
            // views는 app을 import할 수 없음
            {
              target: './src/views/**',
              from: './src/app/**',
            },
          ],
        },
      ],

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
]);

export default eslintConfig;
