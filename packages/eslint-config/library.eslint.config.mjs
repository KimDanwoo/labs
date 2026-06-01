import typescriptParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';

/**
 * 라이브러리 패키지(@ui/react, @tokens/css) 공통 ESLint(flat).
 * Next에 의존하지 않는다. 포맷은 Prettier가 담당하고 ESLint는 의미 규칙만 본다.
 */
const eslintConfig = [
  { ignores: ['dist/**', 'generated/**', 'node_modules/**'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      'prettier/prettier': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  eslintConfigPrettier,
];

export default eslintConfig;
