import parser from '@typescript-eslint/parser';
import { Linter } from 'eslint';
import assert from 'node:assert/strict';
import test from 'node:test';
import labs from '../labs.mjs';

function check(code) {
  return new Linter().verify(
    code,
    [
      {
        files: ['**/*.tsx'],
        languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
        plugins: { labs },
        rules: { 'labs/interactive-composition': 'error' },
      },
    ],
    { filename: `${process.cwd()}/src/features/first/ui/First.tsx` },
  );
}

test('a navigation button has only one interactive element', () => {
  assert.equal(check('const First = () => <Link href="/"><Button>Home</Button></Link>;').length, 1);
  assert.equal(check('const First = () => <Button asChild><Link href="/">Home</Link></Button>;').length, 0);
});
