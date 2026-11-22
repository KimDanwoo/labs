import { existsSync } from 'node:fs';
import path from 'node:path';

export const REQUIRED_STATIC_FILES = [
  'palette.ktx',
  'basis/basis_transcoder.js',
  'draco/draco_decoder.js',
  'favicons/favicon.svg',
];

const UNUSED_STATIC_DIRECTORIES = [
  'projects',
  'lab',
  'christmas',
  'easter',
  'whispers',
  'blackFriday',
  'sounds/jingleBells',
  'respawns',
  'ui/previews',
  'draco/gltf',
  'career',
  'timeMachine',
  'achievements',
  'floor',
  'foliage',
  'sounds/hits/pins',
  'sounds/rolling',
];

const UNUSED_STATIC_FILES = new Set([
  'sounds/musics/Boy.mp3',
  'sounds/musics/Baguira.mp3',
  'sounds/musics/Sudo.mp3',
  'ui/map/map-day.png',
  'ui/map/map-night.png',
  'draco/draco_encoder.js',
  'draco/gltf/draco_encoder.js',
  'social/share-image.png',
  'birchTrees/birchTreesVisual-compressed.glb',
  'cherryTrees/cherryTreesVisual-compressed.glb',
  'vehicle/defaultAntenna-compressed.glb',
]);

const UNUSED_FONT_FORMATS = /^fonts\/Pally-/;

const UNCOMPRESSED_FILES_IN_USE = new Set(['vehicle/default.glb', 'vehicle/oldSchool.glb']);

const COMPRESSED_COUNTERPART = [
  [/\.glb$/, '-compressed.glb'],
  [/\.png$/, '.ktx'],
];

export function isUnusedStatic(source, staticDirectory) {
  const relative = path.relative(staticDirectory, source).split(path.sep).join('/');
  if (UNUSED_STATIC_DIRECTORIES.includes(relative)) return true;
  const isUnusedFile = UNUSED_STATIC_FILES.has(relative) || UNUSED_FONT_FORMATS.test(relative);
  if (isUnusedFile) return true;
  if (relative.endsWith('.wav')) return true;
  const isCompressedOrInUse = relative.endsWith('-compressed.glb') || UNCOMPRESSED_FILES_IN_USE.has(relative);
  if (isCompressedOrInUse) return false;
  return COMPRESSED_COUNTERPART.some(
    ([extension, counterpart]) => extension.test(relative) && existsSync(source.replace(extension, counterpart)),
  );
}
