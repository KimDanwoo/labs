import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findImportCycles,
  findServerLeaks,
  validateDesignTokens,
  validateManifest,
  validateSourceTypes,
  validateTypeScript,
} from '../check-architecture.mjs';

test('dependency rules reject raw versions, missing catalog entries and incompatible workspace references', () => {
  const workspaces = new Set(['@ui/react']);
  const catalog = new Set(['react']);
  assert.deepEqual(
    validateManifest({ dependencies: { react: 'catalog:', '@ui/react': 'workspace:*' } }, workspaces, catalog),
    [],
  );
  assert.equal(validateManifest({ dependencies: { react: '^19' } }, workspaces, catalog).length, 1);
  assert.equal(validateManifest({ dependencies: { missing: 'catalog:' } }, workspaces, catalog).length, 1);
  assert.equal(validateManifest({ dependencies: { '@ui/react': '*' } }, workspaces, catalog).length, 1);
});

test('compatibility peer ranges remain valid and child overrides are rejected', () => {
  assert.deepEqual(validateManifest({ peerDependencies: { react: '^19' } }, new Set(), new Set()), []);
  assert.equal(validateManifest({ name: 'app', pnpm: { overrides: { react: 'x' } } }, new Set(), new Set()).length, 1);
});

test('TypeScript packages inherit strictness and cannot disable protected compiler options', () => {
  assert.deepEqual(validateTypeScript({ extends: '@config/tsconfig/next.json' }), []);
  for (const option of ['strict', 'noUncheckedIndexedAccess', 'verbatimModuleSyntax']) {
    assert.equal(validateTypeScript({ compilerOptions: { [option]: false } }).length, 1);
  }
});

test('shared dependencies are valid but imports through a public barrel cannot create a cycle', () => {
  assert.deepEqual(
    findImportCycles(
      new Map([
        ['screen', ['index']],
        ['index', ['button']],
        ['button', []],
      ]),
    ),
    [],
  );
  assert.deepEqual(
    findImportCycles(
      new Map([
        ['index', ['button']],
        ['button', ['index']],
      ]),
    ),
    [['index', 'button', 'index']],
  );
  assert.deepEqual(findImportCycles(new Map([['index', ['index']]])), [['index', 'index']]);
});

test('client imports through a barrel cannot expose server IO; explicit Server Actions are a valid boundary', () => {
  const graph = new Map([
    ['screen', ['index']],
    ['index', ['filesystem']],
    ['filesystem', []],
  ]);
  assert.deepEqual(findServerLeaks(graph, new Set(['screen']), new Set(['filesystem']), new Set()), [
    ['screen', 'index', 'filesystem'],
  ]);
  assert.deepEqual(findServerLeaks(graph, new Set(['screen']), new Set(['filesystem']), new Set(['index'])), []);
});

test('unsafe any is rejected in libraries too, while strings and comments remain valid', () => {
  assert.equal(validateSourceTypes('export const value: any = 1;', 'library.ts').length, 1);
  assert.deepEqual(validateSourceTypes("export const label = 'any'; // any is just text", 'library.ts'), []);
});

test('styles use design tokens: default palette, arbitrary colors and unsupported font weights are rejected with explicit exceptions', () => {
  assert.deepEqual(validateDesignTokens('<p className="bg-primary text-muted-foreground font-semibold px-lg" />'), []);
  assert.equal(validateDesignTokens('<p className="text-green-500 hover:bg-red-500/10" />').length, 2);
  assert.equal(validateDesignTokens('<p className="bg-[#f7f8fc] text-[oklch(0.5_0.1_240)]" />').length, 2);
  assert.equal(validateDesignTokens('<p className="font-medium" />').length, 1);
  assert.equal(validateDesignTokens('<p className="font-extrabold" />').length, 1);
  assert.deepEqual(validateDesignTokens('<code className="font-mono font-medium" />'), []);
  assert.deepEqual(validateDesignTokens('<p className="text-[13px] max-w-[20rem]" />'), []);
  assert.deepEqual(validateDesignTokens('{/* token-exception: 고정폭 서체 */}\n<p className="font-medium" />'), []);
});
