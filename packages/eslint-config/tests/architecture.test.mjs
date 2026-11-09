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
  assert.equal(check('independent-slices', "import { state } from '../model/store/first';").length, 0);
  assert.equal(check('independent-slices', "import { state } from '@entities/game';").length, 0);
  assert.equal(check('independent-slices', "import { state } from '@features/second';").length, 1);
  assert.equal(check('independent-slices', "import { state } from '@widgets/game';").length, 1);
});

test('other slices are reached only through their public API', () => {
  assert.equal(check('public-api', "import { Game } from '@entities/game';").length, 0);
  assert.equal(check('public-api', "import { loadGame } from '@entities/game/index.server';").length, 0);
  for (const code of [
    "import { Game } from '@entities/game/ui';",
    "import { state } from '@entities/game/model/store/game';",
    "import { Game } from '../../../entities/game/ui/Game';",
    "export { Game } from '@entities/game/ui/Game';",
    "const game = import('@entities/game/ui/Game');",
    'const game = import(`@entities/game/ui/Game`);',
    "type Game = import('@entities/game/model/types/game').Game;",
  ])
    assert.equal(check('public-api', code).length, 1, code);
});

test('a slice does not import its own public API', () => {
  assert.equal(check('public-api', "import { state } from '../model/store/first';").length, 0);
  assert.equal(check('public-api', "import { First } from '@features/first';").length, 1);
  assert.equal(check('public-api', "import { First } from '../index';").length, 1);
  assert.equal(check('public-api', "import { state } from '@features/first/model/store/first';").length, 1);
});

test('a public API re-exports names explicitly', () => {
  assert.equal(check('public-api', "export { First } from './ui/First';", 'src/features/first/index.ts').length, 0);
  assert.equal(check('public-api', "export * from './ui/First';", 'src/features/first/index.ts').length, 1);
});

test('Next route files outside src also use public APIs; tests may reach internals', () => {
  assert.equal(check('public-api', "import { HomeView } from '@pages/home';", 'app/page.tsx').length, 0);
  assert.equal(check('public-api', "import { HomeView } from '@pages/home/ui/HomeView';", 'app/page.tsx').length, 1);
  assert.equal(
    check(
      'public-api',
      "import { state } from '@entities/game/model/store/game';",
      'src/features/first/model/__tests__/x.test.ts',
    ).length,
    0,
  );
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

test('slice roots hold only the public API; model files live inside an explicit segment', () => {
  assert.equal(check('slice-structure', 'export {};', 'src/features/first/index.ts').length, 0);
  assert.equal(check('slice-structure', 'export {};', 'src/features/first/index.server.ts').length, 0);
  assert.equal(check('slice-structure', 'export const value = 1;', 'src/features/first/api/request.ts').length, 0);
  assert.equal(check('slice-structure', 'export {};', 'src/_pages/home/HomeView.tsx').length, 1);
  assert.equal(check('slice-structure', 'export {};', 'src/features/first/ui/index.ts').length, 1);
  assert.equal(check('slice-structure', 'export const value = 1;', 'src/features/first/model/types.ts').length, 1);
  assert.equal(
    check('slice-structure', 'export const value = 1;', 'src/features/first/model/types/first.ts').length,
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
  assert.equal(check('routing-location', 'export default function Page() {}', 'src/_app/page.tsx').length, 1);
  assert.equal(
    check('routing-location', 'export function AppProviders() {}', 'src/_app/providers/AppProviders.tsx').length,
    0,
  );
});

test('global atoms belong to a slice store', () => {
  assert.equal(check('entity-state', 'const value = atom(0);', 'src/features/first/model/store/first.ts').length, 0);
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
