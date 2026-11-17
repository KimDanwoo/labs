import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { WORLD_RAW_BASE } from '../../scripts/worldSource.mjs';

const SOURCES_DIRECTORY = path.resolve(import.meta.dirname, '.sources');
const UPSTREAM_FILES = ['resources/palette.png', 'resources/folio-2025.blend'];

async function download(upstreamPath) {
  const target = path.join(SOURCES_DIRECTORY, path.basename(upstreamPath));
  if (existsSync(target)) return `${path.basename(target)} 이미 있어요`;
  const response = await fetch(`${WORLD_RAW_BASE}/${upstreamPath}`);
  if (!response.ok) throw new Error(`${upstreamPath}를 받지 못했어요: HTTP ${response.status}`);
  const partial = `${target}.partial`;
  writeFileSync(partial, Buffer.from(await response.arrayBuffer()));
  renameSync(partial, target);
  return `${path.basename(target)} 받았어요`;
}

mkdirSync(SOURCES_DIRECTORY, { recursive: true });
for (const upstreamPath of UPSTREAM_FILES) process.stdout.write(`${await download(upstreamPath)}\n`);
