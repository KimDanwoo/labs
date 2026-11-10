import parser from '@typescript-eslint/parser';
import { Linter } from 'eslint';
import assert from 'node:assert/strict';
import test from 'node:test';
import architecture from '../architecture.mjs';

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

test('sibling slices and upward dependencies fail', () => {
  assert.equal(check('independent-slices', "import { state } from '../model/store';").length, 0);
  assert.equal(check('independent-slices', "import { state } from '@entities/game';").length, 0);
  assert.equal(check('independent-slices', "import { state } from '@features/second';").length, 1);
  assert.equal(check('independent-slices', "import { Home } from '@views/home';").length, 1);
});

test('relative, re-exported and dynamic imports cannot bypass layer boundaries', () => {
  for (const code of [
    "import { Other } from '../../../views/home/ui/Home';",
    "export { Other } from '@features/second';",
    "export * from '@features/second';",
    "const other = import('@features/second');",
    'const other = import(`@features/second`);',
    "type Other = import('@features/second').Other;",
    "import { Other } from '@features/first/../second';",
  ])
    assert.equal(check('independent-slices', code).length, 1, code);
});

test('slices expose a root public API and purpose-named segments only', () => {
  const structure = (filename) => check('slice-structure', 'export const value = 1;', filename).length;
  assert.equal(structure('src/features/first/index.ts'), 0);
  assert.equal(structure('src/features/first/index.server.ts'), 0);
  assert.equal(structure('src/features/first/model/hooks/useFirst.ts'), 0);
  assert.equal(structure('src/features/first/api/firstApi.ts'), 0);
  assert.equal(structure('src/features/first/actions.ts'), 1);
  assert.equal(structure('src/features/first/hooks/useFirst.ts'), 1);
  assert.equal(structure('src/features/first/model/index.ts'), 1);
  assert.equal(structure('src/features/first/model/hooks/index.ts'), 1);
  assert.equal(structure('src/views/home/HomeView.tsx'), 1);
});

test('shared has purpose segments and per-item entries', () => {
  const structure = (filename) => check('slice-structure', 'export const value = 1;', filename).length;
  assert.equal(structure('src/shared/lib/cn/index.ts'), 0);
  assert.equal(structure('src/shared/lib/cn.ts'), 0);
  assert.equal(structure('src/shared/config/index.ts'), 0);
  assert.equal(structure('src/shared/lib/index.ts'), 1);
  assert.equal(structure('src/shared/ui/index.ts'), 1);
  assert.equal(structure('src/shared/world/world.ts'), 1);
  assert.equal(structure('src/shared/model/store.ts'), 1);
});

test('slices are imported through their public API only', () => {
  const api = (code, filename) => check('public-api', code, filename).length;
  assert.equal(api("import { Game } from '@entities/game';"), 0);
  assert.equal(api("import { loadGame } from '@entities/game/index.server';"), 0);
  assert.equal(api("import { First } from './First';"), 0);
  assert.equal(api("import { state } from '../model/store';"), 0);
  assert.equal(api("import { cn } from '@shared/lib/cn';"), 0);
  assert.equal(api("import { SITE } from '@shared/config';"), 0);
  assert.equal(api("import { Home } from '@views/home';", 'app/page.tsx'), 0);
  for (const code of [
    "import { Game } from '@entities/game/model/types';",
    "import { Game } from '../../../entities/game/ui/Game';",
    "export { Game } from '@entities/game/ui/Game';",
    "const game = import('@entities/game/ui/Game');",
    'const game = import(`@entities/game/ui/Game`);',
    "type Game = import('@entities/game/model/types').Game;",
    "import { state } from '@features/first/model/store';",
    "import { First } from '@features/first';",
    "import { First } from '../index';",
    "import { cn } from '@shared/lib';",
    "import { cn } from '@shared/lib/cn/cn';",
  ])
    assert.equal(api(code), 1, code);
  assert.equal(api("import { Home } from '@views/home/ui/Home';", 'app/page.tsx'), 1);
  assert.equal(api("import { variants } from './variants';", 'src/shared/ui/button/Button.tsx'), 0);
  assert.equal(api("import { cn } from '@shared/lib/cn';", 'src/shared/ui/button/Button.tsx'), 0);
  assert.equal(api("import { app } from '@shared/lib/firebase/config';", 'src/shared/ui/button/Button.tsx'), 1);
  assert.equal(api("import { app } from '../../lib/firebase/config';", 'src/shared/ui/button/Button.tsx'), 1);
  assert.equal(api("import { Game } from '@entities/game/model/types';", 'src/features/first/model/first.test.ts'), 0);
});

test('public entries name their exports', () => {
  assert.equal(check('public-api', "export * from './ui/First';", 'src/features/first/index.ts').length, 1);
  assert.equal(check('public-api', "export { First } from './ui/First';", 'src/features/first/index.ts').length, 0);
  assert.equal(
    check('public-api', "export type { First } from './model/types';", 'src/features/first/index.ts').length,
    0,
  );
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
  assert.equal(
    check('component-file', 'function Other() { return <div />; }', 'src/entities/game/config/ui/Other.tsx').length,
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

test('global atoms belong to a slice model', () => {
  const state = (code, filename) => check('entity-state', code, filename).length;
  const atom = "import { atom } from 'jotai';\nconst value = atom(0);";
  assert.equal(state(atom), 1);
  assert.equal(state(atom, 'src/shared/lib/store.ts'), 1);
  assert.equal(state(atom, 'src/views/home/ui/model/state.ts'), 1);
  assert.equal(state(atom, 'src/entities/game/model/store/game.ts'), 0);
  assert.equal(
    state(
      "import { atomWithStorage } from 'jotai/utils';\nconst value = atomWithStorage('key', 0);",
      'src/views/home/model/store.ts',
    ),
    0,
  );
  assert.equal(state("import { atom as makeAtom } from 'jotai/vanilla';\nconst value = makeAtom(0);"), 1);
  assert.equal(state("import * as jotai from 'jotai';\nconst value = jotai.atom(0);"), 1);
  assert.equal(state("import { atom } from './chemistry';\nconst value = atom(0);"), 0);
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
