import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findImportCycles,
  findMisplacedStyles,
  findServerLeaks,
  validateComponentModule,
  validateComponentProps,
  validateDesignTokens,
  validateManifest,
  validateSourceTypes,
  validateTypeScript,
  validateVercelConfig,
} from '../check-architecture.mjs';

test('dependency rules reject raw versions, missing catalog entries and incompatible workspace references', () => {
  const workspaces = new Set(['@repo/fonts']);
  const catalog = new Set(['react']);
  assert.deepEqual(
    validateManifest({ dependencies: { react: 'catalog:', '@repo/fonts': 'workspace:*' } }, workspaces, catalog),
    [],
  );
  assert.equal(validateManifest({ dependencies: { react: '^19' } }, workspaces, catalog).length, 1);
  assert.equal(validateManifest({ dependencies: { missing: 'catalog:' } }, workspaces, catalog).length, 1);
  assert.equal(validateManifest({ dependencies: { '@repo/fonts': '*' } }, workspaces, catalog).length, 1);
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

test('apps deploy only main, skip unchanged builds and point Vercel commands at themselves', () => {
  const mainOnly = { git: { deploymentEnabled: { '**': false, main: true } } };
  assert.deepEqual(validateVercelConfig({ ...mainOnly, ignoreCommand: 'npx turbo-ignore hub' }, 'hub'), []);
  assert.deepEqual(
    validateVercelConfig(
      { ...mainOnly, ignoreCommand: 'git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- .' },
      'hub',
    ),
    [],
  );
  assert.equal(validateVercelConfig({ ignoreCommand: 'npx turbo-ignore hub' }, 'hub').length, 1);
  assert.equal(
    validateVercelConfig(
      { git: { deploymentEnabled: { '**': false, main: true, dev: true } }, ignoreCommand: 'npx turbo-ignore hub' },
      'hub',
    ).length,
    1,
  );
  assert.equal(validateVercelConfig(mainOnly, 'hub').length, 1);
  assert.equal(validateVercelConfig({ ...mainOnly, ignoreCommand: 'npx turbo-ignore soundlab' }, 'hub').length, 1);
  assert.equal(
    validateVercelConfig(
      {
        ...mainOnly,
        ignoreCommand: 'npx turbo-ignore hub',
        buildCommand: 'pnpm exec turbo run build --filter=soundlab',
      },
      'hub',
    ).length,
    1,
  );
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

test('component modules hold only components and hooks; constants, helpers and stray consts are rejected', () => {
  const valid = [
    'export function Card() { return null; }',
    'export const Panel = () => null;',
    'const Chart = dynamic(() => import("./Chart"));',
    'export const Row = memo(function Row() { return null; });',
    'export const Card = Object.assign(CardRoot, { Header: CardHeader });',
    'const buttonVariants = cva("inline-flex", { variants: {} });',
    'export function useToggle() { return true; }',
    'interface CardProps { title: string }',
  ].join('\n');
  assert.deepEqual(validateComponentModule(valid, 'Card.tsx'), []);
  assert.equal(validateComponentModule('const MAX_ITEMS = 3;', 'Card.tsx').length, 1);
  assert.equal(validateComponentModule('const TABS = [{ name: "a" }] as const;', 'Card.tsx').length, 1);
  assert.equal(validateComponentModule('function formatTime() { return ""; }', 'Card.tsx').length, 1);
  assert.equal(validateComponentModule('const useless = () => null;', 'Card.tsx').length, 1);
});

test('components with more than five props must be split into composed parts', () => {
  const five =
    'interface CardProps { a: string; b: string; c: string; d: string; e: string }\nexport function Card(props: CardProps) { return null; }';
  assert.deepEqual(validateComponentProps(five, 'Card.tsx'), []);
  const six =
    'interface CardProps { a: string; b: string; c: string; d: string; e: string; f: string }\nexport function Card(props: CardProps) { return null; }';
  assert.equal(validateComponentProps(six, 'Card.tsx').length, 1);
  const inline = 'export const Card = (props: { a: 1; b: 1; c: 1; d: 1; e: 1; f: 1 }) => null;';
  assert.equal(validateComponentProps(inline, 'Card.tsx').length, 1);
  const extended =
    'interface ButtonProps extends ComponentProps<"button"> { variant?: string }\nexport function Button(props: ButtonProps) { return null; }';
  assert.deepEqual(validateComponentProps(extended, 'Button.tsx'), []);
});

test('CSS files live in src/app/styles or a slice styles/ folder; only <Component>.module.css sits next to ui components', () => {
  assert.deepEqual(
    findMisplacedStyles([
      'src/app/globals.css',
      'src/app/styles/colors.css',
      'src/views/drive/styles/world.css',
      'src/views/drive/ui/Menu.tsx',
      'src/views/drive/ui/Menu.module.css',
      'src/shared/ui/sheet/Sheet.module.css',
    ]),
    [],
  );
  assert.equal(findMisplacedStyles(['src/views/drive/ui/world.css']).length, 1);
  assert.equal(findMisplacedStyles(['src/views/drive/ui/menu.module.css']).length, 1);
  assert.equal(findMisplacedStyles(['src/shared/ui/sheet.css']).length, 1);
  assert.equal(findMisplacedStyles(['app/page.css']).length, 1);
});
