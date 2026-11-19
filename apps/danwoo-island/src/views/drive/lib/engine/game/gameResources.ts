import { WORLD_CONFIG } from '../worldConfig';
import { modelResource, type ResourceSpec, type TextureFormat, textureResource } from './resourcesLoader';
import { clamp, halfWidth, linear, nearest, repeat, repeatX, srgb, unflipped, withSetups } from './textureSetups';
import { islandModelResources } from './world/islandModels';
import { islandTextureResources } from './world/islandTextures';

interface AssetNames {
  modelSuffix: string;
  textureFormat: TextureFormat;
  textureExtension: string;
}

const CACHE_BUSTER = '';
const KEY_ICONS = ['Cross', 'Enter', 'A'];
const CAREERS = ['Freelancer', 'Hetic', 'ImmersiveGarden', 'IRLTeacher', 'OnlineTeacher', 'Uzik'];
const TIME_MACHINE_SCREENS = ['MGS', 'Folio'];

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
    textureResource('foliageTexture', `foliage/cherryPetalSDF.png${cb}`, 'texture', nearest),
    model('bushesReferences', 'bushes/bushesReferences'),
    model('vehicle', 'vehicle/default'),
    model('flowersReferencesModel', 'flowers/flowersReferences'),
    model('explosiveCratesModel', 'explosiveCrates/explosiveCrates'),
    model('lanternsModel', 'lanterns/lanterns'),
    textureResource('terrainTexture', `terrain/terrain.png${cb}`, 'texture', unflipped),
    modelResource('terrainModel', `terrain/terrain.glb${cb}`),
    textureResource('floorSlabsTexture', `floor/slabs.${textureExtension}`, textureFormat, withSetups(repeat, linear)),
    model('areasModel', 'areas/areas'),
    model('poleLightsModel', 'poleLights/poleLights'),
    texture('overlayPatternTexture', 'overlay/overlayPattern', repeat, nearest),
    ...KEY_ICONS.map((key) =>
      texture(`interactivePointsKeyIcon${key}Texture`, `interactivePoints/interactivePointsKeyIcon${key}`, nearest),
    ),
    textureResource('islandMapTexture', `areas/island/islandMap.webp${cb}`, 'texture', srgb),
    textureResource('bowlingNeonTexture', `bowling/neonSign.webp${cb}`, 'texture', withSetups(srgb, linear)),
    texture('jukeboxMusicNotes', 'jukebox/jukeboxMusicNotes', linear),
    texture('achievementsGlyphsTexture', 'achievements/glyphs', linear, repeatX),
    ...CAREERS.map((career) => texture(`career${career}Texture`, `career/career${career}`, unflipped, linear, clamp)),
    ...TIME_MACHINE_SCREENS.map((screen) =>
      texture(`timeMachineScreen${screen}Texture`, `timeMachine/timeMachineScreen${screen}`, nearest, clamp, srgb),
    ),
    ...islandTextureResources(cb),
    ...islandModelResources(cb),
  ];
}
