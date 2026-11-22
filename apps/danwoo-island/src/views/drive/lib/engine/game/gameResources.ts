import {
  modelResource,
  type ResourceSpec,
  type TextureFormat,
  textureResource,
} from '@views/drive/lib/engine/game/resourcesLoader';
import {
  halfWidth,
  linear,
  nearest,
  repeat,
  srgb,
  unflipped,
  withSetups,
} from '@views/drive/lib/engine/game/textureSetups';
import { islandModelResources } from '@views/drive/lib/engine/game/world/islandModels';
import { islandTextureResources } from '@views/drive/lib/engine/game/world/islandTextures';
import { WORLD_CONFIG } from '@views/drive/lib/engine/worldConfig';

interface AssetNames {
  modelSuffix: string;
  textureFormat: TextureFormat;
  textureExtension: string;
}

const CACHE_BUSTER = '';
const KEY_ICONS = ['Cross', 'Enter', 'A'];

function assetNames(): AssetNames {
  const isCompressed = WORLD_CONFIG.compressedAssets;
  return {
    modelSuffix: isCompressed ? '-compressed' : '',
    textureFormat: isCompressed ? 'textureKtx' : 'texture',
    textureExtension: isCompressed ? 'ktx' : 'png',
  };
}

export function introResources(): ResourceSpec[] {
  const { textureFormat, textureExtension } = assetNames();
  const cb = CACHE_BUSTER;
  return [
    textureResource(
      'behindTheSceneStarsTexture',
      `behindTheScene/stars.${textureExtension}${cb}`,
      textureFormat,
      withSetups(srgb, nearest, repeat),
    ),
    textureResource(
      'soundTexture',
      `intro/sound.${textureExtension}${cb}`,
      textureFormat,
      withSetups(linear, halfWidth),
    ),
    textureResource('paletteTexture', `palette.${textureExtension}${cb}`, textureFormat, withSetups(nearest, srgb)),
  ];
}

export function driveResources(): ResourceSpec[] {
  const { modelSuffix, textureFormat, textureExtension } = assetNames();
  const cb = CACHE_BUSTER;
  const texture = (name: string, path: string, ...setups: Parameters<typeof withSetups>): ResourceSpec =>
    textureResource(name, `${path}.${textureExtension}${cb}`, textureFormat, withSetups(...setups));
  const model = (name: string, path: string): ResourceSpec => modelResource(name, `${path}${modelSuffix}.glb${cb}`);
  return [
    model('bushesReferences', 'bushes/bushesReferences'),
    model('vehicle', 'vehicle/default'),
    model('flowersReferencesModel', 'flowers/flowersReferences'),
    model('explosiveCratesModel', 'explosiveCrates/explosiveCrates'),
    model('lanternsModel', 'lanterns/lanterns'),
    textureResource('terrainTexture', `terrain/terrain.png${cb}`, 'texture', unflipped),
    modelResource('terrainModel', `terrain/terrain.glb${cb}`),
    model('areasModel', 'areas/areas'),
    model('poleLightsModel', 'poleLights/poleLights'),
    ...KEY_ICONS.map((key) =>
      texture(`interactivePointsKeyIcon${key}Texture`, `interactivePoints/interactivePointsKeyIcon${key}`, nearest),
    ),
    textureResource('islandMapTexture', `areas/island/islandMap.webp${cb}`, 'texture', srgb),
    texture('jukeboxMusicNotes', 'jukebox/jukeboxMusicNotes', linear),
    ...islandTextureResources(cb),
    ...islandModelResources(cb),
  ];
}
