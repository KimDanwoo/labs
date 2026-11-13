export const WORLD_ASSET_BASE = '/world/';

export const CRITICAL_WORLD_ASSETS = [
  'respawns/respawnsReferences-compressed.glb?cb=1',
  'behindTheScene/stars.ktx?cb=1',
  'intro/sound.ktx?cb=1',
  'palette.ktx?cb=1',
] as const;

const RESOLVED_URL = /^(?:[a-z][a-z0-9+.-]*:|\/)/i;
const CURRENT_DIRECTORY_PREFIX = /^\.\//;

export function worldAsset(path: string): string {
  if (RESOLVED_URL.test(path)) return path;
  return WORLD_ASSET_BASE + path.replace(CURRENT_DIRECTORY_PREFIX, '');
}
