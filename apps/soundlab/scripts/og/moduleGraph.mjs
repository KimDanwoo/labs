import { readFile, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';

/**
 * 렌더러와 그 렌더러가 상대 경로로 부르는 모듈을 타입만 벗겨 한 폴더에 평평하게 쓴다.
 * 브라우저는 확장자 없는 지정자를 못 읽으므로 import 경로를 쓴 파일 이름(.js)으로 바꾼다.
 */
export async function writeModuleGraph(entry, outDir, entryName) {
  const names = new Map([[entry, entryName]]);
  const pending = [entry];
  while (pending.length) {
    const file = pending.pop();
    const source = stripTypeScriptTypes(await readFile(file, 'utf8'), { mode: 'strip' });
    const code = source.replace(/(from\s+')(\.[^']+)(')/g, (_, open, spec, close) => {
      const target = resolve(dirname(file), `${spec}.ts`);
      if (!names.has(target)) {
        names.set(target, `${relative(dirname(entry), target).replace(/[^\w]+/g, '-')}.js`);
        pending.push(target);
      }
      return `${open}./${names.get(target)}${close}`;
    });
    await writeFile(join(outDir, names.get(file)), code);
  }
}
