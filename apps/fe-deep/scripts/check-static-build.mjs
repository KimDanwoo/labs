import { readFileSync } from 'node:fs';

import { findServerFeatures } from './serverFeatures.mjs';

const BUILD_DIR = new URL('../.next/', import.meta.url);

function readManifest(name) {
  return JSON.parse(readFileSync(new URL(name, BUILD_DIR), 'utf8'));
}

const appRoutes = Object.values(readManifest('app-path-routes-manifest.json'));
const serverFeatures = findServerFeatures({
  appRoutes,
  prerender: readManifest('prerender-manifest.json'),
  functionsConfig: readManifest('server/functions-config-manifest.json'),
  middlewareManifest: readManifest('server/middleware-manifest.json'),
  serverReferences: readManifest('server/server-reference-manifest.json'),
});

if (serverFeatures.length > 0) {
  console.error(
    `fe-deep은 서버 없이 정적으로만 배포한다. 요청 때 서버에서 실행되는 기능이 생겼다:\n${serverFeatures.map((feature) => `  - ${feature}`).join('\n')}`,
  );
  process.exitCode = 1;
} else console.log(`Static build: ${appRoutes.length}개 경로 모두 빌드 때 만들어졌고 서버 함수·Server Action이 없다.`);
