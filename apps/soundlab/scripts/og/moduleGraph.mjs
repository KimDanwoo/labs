import { readFile, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';

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
