import parser from '@typescript-eslint/parser';
import { Linter } from 'eslint';
import assert from 'node:assert/strict';
import test from 'node:test';
import architecture from '../rules/architecture.mjs';

function check(rule, code, filename = 'src/features/first/ui/First.tsx') {
  return new Linter().verify(
    code,
    [
      {
        files: ['**/*.{ts,tsx}'],
        languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
        plugins: { fsd: architecture },
        rules: { [`fsd/${rule}`]: 'error' },
      },
    ],
    { filename: `${process.cwd()}/${filename}` },
  );
}

test('same-slice imports work; sibling slices and upward dependencies fail', () => {
  assert.equal(check('independent-slices', "import { state } from '@features/first/model/store';").length, 0);
  assert.equal(check('independent-slices', "import { state } from '@entities/game/model/store';").length, 0);
  assert.equal(check('independent-slices', "import { state } from '@features/second/model/store';").length, 1);
  assert.equal(check('independent-slices', "import { state } from '@widgets/game/ui';").length, 1);
});

test('relative, re-exported and dynamic imports cannot bypass layer boundaries', () => {
  for (const code of [
    "import { Other } from '../../../widgets/game/ui';",
    "export { Other } from '@features/second/ui';",
    "export * from '@features/second/ui';",
    "const other = import('@features/second/ui');",
    "import { Other } from '@features/first/../second/ui';",
  ])
    assert.equal(check('independent-slices', code).length, 1, code);
});

test('model files must live inside an explicit segment', () => {
  assert.equal(check('slice-structure', 'export const value = 1;', 'src/features/first/model/types.ts').length, 1);
  assert.equal(
    check('slice-structure', 'export const value = 1;', 'src/features/first/model/types/index.ts').length,
    0,
  );
  assert.equal(check('slice-structure', 'export const value = 1;', 'src/features/first/actions.ts').length, 1);
});

test('components require a matching file and cannot hide in a hook', () => {
  assert.equal(check('component-file', 'function First() { return <div />; }').length, 0);
  assert.equal(
    check('component-file', 'function First() { return <div />; } function Other() { return <div />; }').length,
    1,
  );
  assert.equal(check('component-file', 'const Other = () => <div />;').length, 1);
  assert.equal(
    check('component-file', 'function Provider() { return <div />; }', 'src/entities/game/model/hooks/useGame.tsx')
      .length,
    1,
  );
});

test('Next routes cannot be placed in the FSD app layer', () => {
  assert.equal(check('routing-location', 'export default function Page() {}', 'src/app/page.tsx').length, 1);
  assert.equal(
    check('routing-location', 'export function AppProviders() {}', 'src/app/providers/AppProviders.tsx').length,
    0,
  );
});

test('global atoms belong to entity stores', () => {
  assert.equal(check('entity-state', 'const value = atom(0);').length, 1);
  assert.equal(
    check('entity-state', 'const value = atomWithStorage("key", 0);', 'src/entities/game/model/hooks/useGame.ts')
      .length,
    1,
  );
  assert.equal(check('entity-state', 'const value = atom(0);', 'src/entities/game/model/store/game.ts').length, 0);
});

test('a navigation button has only one interactive element', () => {
  assert.equal(
    check('interactive-composition', 'const First = () => <Link href="/"><Button>Home</Button></Link>;').length,
    1,
  );
  assert.equal(
    check('interactive-composition', 'const First = () => <Button asChild><Link href="/">Home</Link></Button>;').length,
    0,
  );
});
