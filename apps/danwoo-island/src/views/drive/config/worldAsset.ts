export const WORLD_ASSET_BASE = '/world/';
const VERSION_PARAMETER = 'v';
const VERSION_PATTERN = /^[0-9a-f]{12}$/;
const WORLD_VERSION = VERSION_PATTERN.test(process.env.NEXT_PUBLIC_WORLD_VERSION ?? '')
  ? process.env.NEXT_PUBLIC_WORLD_VERSION
  : null;

export const CRITICAL_WORLD_ASSETS = [
  'respawns/respawnsReferences-compressed.glb',
  'behindTheScene/stars.ktx',
  'intro/sound.ktx',
  'palette.ktx',
] as const;

const RESOLVED_URL = /^(?:[a-z][a-z0-9+.-]*:|\/)/i;
const CURRENT_DIRECTORY_PREFIX = /^\.\//;

function withVersion(url: string): string {
  if (!WORLD_VERSION || url.includes(`${VERSION_PARAMETER}=`)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${VERSION_PARAMETER}=${WORLD_VERSION}`;
}

export function worldAsset(path: string): string {
  if (path.startsWith(WORLD_ASSET_BASE)) return withVersion(path);
  if (RESOLVED_URL.test(path)) return path;
  return withVersion(WORLD_ASSET_BASE + path.replace(CURRENT_DIRECTORY_PREFIX, ''));
}
