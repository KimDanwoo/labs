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
  'ui/previews/easter.png',
  'ui/previews/easter.webp',
  'foliage/foliageSDF.ktx',
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
  if (UNUSED_STATIC_FILES.has(relative) || UNUSED_FONT_FORMATS.test(relative)) return true;
  if (relative.endsWith('.wav')) return true;
  if (relative.endsWith('-compressed.glb') || UNCOMPRESSED_FILES_IN_USE.has(relative)) return false;
  return COMPRESSED_COUNTERPART.some(
    ([extension, counterpart]) => extension.test(relative) && existsSync(source.replace(extension, counterpart)),
  );
}
