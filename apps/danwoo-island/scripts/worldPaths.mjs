import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORLD_COMMIT } from './worldSource.mjs';

export const SYNC_FORMAT_VERSION = '8';

export const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const SPARSE_PATHS = ['/static/', '/license.md'];

export const CHECKOUT_DIRECTORY = path.join(tmpdir(), `danwoo-island-world-${WORLD_COMMIT.slice(0, 7)}`);

const PUBLIC_DIRECTORY = path.join(APP_ROOT, 'public');

export const WORLD_DIRECTORY = path.join(PUBLIC_DIRECTORY, 'world');

export const STAGING_DIRECTORY = path.join(PUBLIC_DIRECTORY, '.world-staging');

export const PREVIOUS_DIRECTORY = path.join(PUBLIC_DIRECTORY, '.world-previous');

export const STAMP_FILE = '.stamp';

export const OVERRIDES_DIRECTORY = path.join(APP_ROOT, 'world-overrides');

export const CONTENT_MODULE = path.join(APP_ROOT, 'src/views/drive/lib/engine/data/danwoo.ts');

export const LEGACY_CONTENT_MODULE = path.join(APP_ROOT, 'src/views/drive/lib/engine/data/danwoo.js');
