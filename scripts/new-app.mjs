#!/usr/bin/env node
// templates/app 을 복제해 apps/<name> 새 앱을 만든다.
// 사용법: pnpm new-app <name>
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TEMPLATE = join(ROOT, 'templates', 'app');
const PLACEHOLDER = '__APP_NAME__';

const name = process.argv[2];
if (!name) {
  console.error('사용법: pnpm new-app <name>');
  process.exit(1);
}
if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error('앱 이름은 소문자/숫자/하이픈만 가능합니다 (예: my-site).');
  process.exit(1);
}

const dest = join(ROOT, 'apps', name);
if (existsSync(dest)) {
  console.error(`이미 존재합니다: apps/${name}`);
  process.exit(1);
}

cpSync(TEMPLATE, dest, { recursive: true });

function replaceInTree(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      replaceInTree(full);
    } else {
      const content = readFileSync(full, 'utf8');
      if (content.includes(PLACEHOLDER)) {
        writeFileSync(full, content.split(PLACEHOLDER).join(name), 'utf8');
      }
    }
  }
}
replaceInTree(dest);

console.log(`✓ apps/${name} 생성 완료`);
console.log('  다음 단계: pnpm install && pnpm dev --filter ' + name);
