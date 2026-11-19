import assert from 'node:assert/strict';
import test from 'node:test';

import { findServerFeatures } from '../serverFeatures.mjs';

const STATIC = { initialRevalidateSeconds: false };

function build(overrides = {}) {
  return {
    appRoutes: ['/', '/study/[slug]'],
    prerender: {
      routes: { '/': STATIC, '/study/a': STATIC },
      dynamicRoutes: { '/study/[slug]': { fallback: false } },
    },
    functionsConfig: { functions: {} },
    middlewareManifest: { middleware: {} },
    serverReferences: { node: {}, edge: {} },
    ...overrides,
  };
}

test('a fully prerendered build has no server features', () => {
  assert.deepEqual(findServerFeatures(build()), []);
});

test('routes rendered per request are reported', () => {
  assert.deepEqual(findServerFeatures(build({ appRoutes: ['/', '/api/feedback'] })), ['경로 /api/feedback']);
});

test('dynamic segments that render unknown params on demand are reported', () => {
  const prerender = { routes: {}, dynamicRoutes: { '/study/[slug]': { fallback: null } } };
  assert.deepEqual(findServerFeatures(build({ appRoutes: ['/study/[slug]'], prerender })), ['경로 /study/[slug]']);
});

test('revalidated routes are reported because regeneration needs a server', () => {
  const prerender = { routes: { '/': { initialRevalidateSeconds: 60 } }, dynamicRoutes: {} };
  assert.deepEqual(findServerFeatures(build({ appRoutes: ['/'], prerender })), ['경로 /']);
});

test('proxy and edge middleware are reported as server functions', () => {
  const functionsConfig = { functions: { '/_middleware': { runtime: 'nodejs' } } };
  const middlewareManifest = { middleware: { '/': {} } };
  assert.deepEqual(findServerFeatures(build({ functionsConfig, middlewareManifest })), ['함수 /_middleware', '함수 /']);
});

test('server actions are reported', () => {
  const serverReferences = {
    node: { abc: { filename: 'src/actions/save.ts', exportedName: 'save' } },
    edge: {},
  };
  assert.deepEqual(findServerFeatures(build({ serverReferences })), ['Server Action src/actions/save.ts#save']);
});
