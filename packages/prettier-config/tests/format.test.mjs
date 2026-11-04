import assert from 'node:assert/strict';
import test from 'node:test';
import { format } from 'prettier';
import config from '../index.js';

test('the shared formatter actually removes unused imports using the catalog TypeScript API', async () => {
  const source = "import { readFileSync } from 'node:fs';\nexport const answer=42;\n";
  const output = await format(source, { ...config, filepath: `${process.cwd()}/formatterFixture.ts` });
  assert.equal(output, 'export const answer = 42;\n');
});

test('formatting is stable and preserves client directives', async () => {
  const source = "'use client';\nexport const answer={value:42};\n";
  const output = await format(source, { ...config, filepath: `${process.cwd()}/formatterFixture.ts` });
  assert.ok(output.startsWith("'use client';"));
  assert.equal(await format(output, { ...config, filepath: `${process.cwd()}/formatterFixture.ts` }), output);
});
