import { Linter } from 'eslint';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import fsdConfig from '../../fsd.config.mjs';

const APP = path.join(os.tmpdir(), 'labs-fsd-config-app');

function rulesFor(code, file) {
  return new Linter({ cwd: APP })
    .verify(code, fsdConfig, { filename: path.join(APP, file) })
    .map((message) => message.ruleId);
}

test('labs FSD 설정이 레이어 이름(views)·next·jotai를 실제로 켠다', () => {
  assert.deepEqual(rulesFor("import { Home } from '@views/home';", 'src/features/like/ui/Like.tsx'), [
    'fsd/independent-slices',
  ]);
  assert.deepEqual(rulesFor("import { User } from '@entities/user/model/types';", 'src/views/home/ui/Home.tsx'), [
    'fsd/public-api',
  ]);
  assert.deepEqual(rulesFor('export default function Page() {}', 'src/app/page.tsx'), ['fsd/routing-location']);
  assert.deepEqual(rulesFor("import { atom } from 'jotai';\nexport const flag = atom(0);", 'src/shared/lib/store.ts'), [
    'fsd/entity-state',
  ]);
  assert.deepEqual(rulesFor("import { Home } from '@views/home/ui/Home';", 'app/page.tsx'), ['fsd/public-api']);
});

test('widgets는 레이어로 보지 않고, 루트 파일의 src 상대경로만 막는다', () => {
  assert.deepEqual(rulesFor('export const value = 1;', 'src/widgets/header/Header.ts'), []);
  assert.deepEqual(rulesFor("import { Home } from '../src/views/home';", 'app/page.tsx'), ['no-restricted-imports']);
  assert.deepEqual(rulesFor("import { Ride } from './src/views/ride';", 'proxy.ts'), ['no-restricted-imports']);
  assert.deepEqual(rulesFor("import Image from './opengraph-image';", 'app/page.tsx'), []);
});
