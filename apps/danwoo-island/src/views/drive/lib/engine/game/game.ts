import * as THREE from 'three/webgpu';

import { setStartupStage, STARTUP } from '../islandStartup';
import { WORLD_CONFIG } from '../worldConfig';
import { Audio } from './audio';
import { ClosingManager } from './closingManager';
import { DayCycles } from './cycles/dayCycles';
import { YearCycles } from './cycles/yearCycles';
import { Explosions } from './explosions';
import { Fog } from './fog';
import { bindGame } from './gameContext';
import { Inputs } from './inputs/inputs';
import { InteractivePoints } from './interactivePoints';
import { KonamiCode } from './konamiCode';
import { Lighting } from './lighting';
import { Map as WorldMap } from './map';
import { Materials } from './materials';
import { Menu } from './menu';
import { Modals } from './modals';
import { Noises } from './noises';
import { Notifications } from './notifications';
import { Objects } from './objects';
import { Options } from './options';
import { Overlay } from './overlay';
import { Physics } from './physics/physics';
import { PhysicsVehicle } from './physics/physicsVehicle';
import { PhysicsWireframe } from './physics/physicsWireframe';
import { Player } from './player';
import { PreRenderer } from './preRenderer';
import { QUALITY, Quality } from './quality';
import { RayCursor } from './rayCursor';
import { Rendering } from './rendering';
import {
  modelResource,
  type Resources,
  ResourcesLoader,
  type ResourceSpec,
  type TextureFormat,
  textureResource,
} from './resourcesLoader';
import { Respawns } from './respawns';
import { Reveal } from './reveal';
import { Terrain } from './terrain';
import { Ticker } from './ticker';
import { Time } from './time';
import { Title } from './title';
import { Tracks } from './tracks';
import { requireElement } from './utilities/requireElement';
import { View } from './view';
import { Viewport } from './viewport';
import { Water } from './water';
import { Weather } from './weather';
import { Wind } from './wind';
import { islandModelResources } from './world/islandModels';
import { islandTextureResources } from './world/islandTextures';
import { World } from './world/world';
import { Zones } from './zones';

type Rapier = typeof import('@dimforge/rapier3d-compat');

interface GameSystems {
  domElement: HTMLElement;
  canvasElement: HTMLCanvasElement;
  scene: THREE.Scene;
  resourcesLoader: ResourcesLoader;
  quality: Quality;
  ticker: Ticker;
  time: Time;
  dayCycles: DayCycles;
  yearCycles: YearCycles;
  inputs: Inputs;
  audio: Audio;
  notifications: Notifications;
  rayCursor: RayCursor;
  viewport: Viewport;
  modals: Modals;
  menu: Menu;
  rendering: Rendering;
  resources: Resources;
  options: Options;
  respawns: Respawns;
  view: View;
  reveal: Reveal;
  noises: Noises;
  weather: Weather;
  wind: Wind;
  tracks: Tracks;
  lighting: Lighting;
  fog: Fog;
  water: Water;
  materials: Materials;
  objects: Objects;
  explosions: Explosions;
  world: World;
  RAPIER: Rapier;
  terrain: Terrain;
  physics: Physics;
  wireframe: PhysicsWireframe;
  physicalVehicle: PhysicsVehicle;
  zones: Zones;
  player: Player;
  closingManager: ClosingManager;
  interactivePoints: InteractivePoints;
  konamiCode: KonamiCode;
  map: WorldMap;
  title: Title;
  overlay: Overlay;
}

interface AssetNames {
  modelSuffix: string;
  textureFormat: TextureFormat;
  textureExtension: string;
}

const CACHE_BUSTER = '?cb=1';
const REVEAL_DELAY_FRAMES = 3;
const FIRST_STEP = 1;
const FONT_FACES = ['400 24px MaruBuri', '700 24px MaruBuri'];

function assetNames(): AssetNames {
  const isCompressed = WORLD_CONFIG.compressedAssets;
  return {
    modelSuffix: isCompressed ? '-compressed' : '',
    textureFormat: isCompressed ? 'textureKtx' : 'texture',
    textureExtension: isCompressed ? 'ktx' : 'png',
  };
}

async function loadRapier(): Promise<Rapier> {
  const rapier = await import('@dimforge/rapier3d-compat');
  await rapier.init();
  return rapier;
}

export class Game {
  readonly #systems: Partial<GameSystems> = {};

  constructor() {
    bindGame(this);
    this.#start().catch((error: unknown) => {
      setStartupStage(STARTUP.error);
      reportError(error);
    });
  }

  #provide<K extends keyof GameSystems>(key: K, value: GameSystems[K]): GameSystems[K] {
    this.#systems[key] = value;
    return value;
  }

  #require<K extends keyof GameSystems>(key: K): GameSystems[K] {
    const value = this.#systems[key];
    if (value === undefined) throw new Error(`Game.${key} is not ready`);
    return value;
  }

  get domElement(): HTMLElement {
    return this.#require('domElement');
  }

  get canvasElement(): HTMLCanvasElement {
    return this.#require('canvasElement');
  }

  get scene(): THREE.Scene {
    return this.#require('scene');
  }

  get resourcesLoader(): ResourcesLoader {
    return this.#require('resourcesLoader');
  }

  get quality(): Quality {
    return this.#require('quality');
  }

  get ticker(): Ticker {
    return this.#require('ticker');
  }

  get time(): Time {
    return this.#require('time');
  }

  get dayCycles(): DayCycles {
    return this.#require('dayCycles');
  }

  get yearCycles(): YearCycles {
    return this.#require('yearCycles');
  }

  get inputs(): Inputs {
    return this.#require('inputs');
  }

  get audio(): Audio {
    return this.#require('audio');
  }

  get notifications(): Notifications {
    return this.#require('notifications');
  }

  get rayCursor(): RayCursor {
    return this.#require('rayCursor');
  }

  get viewport(): Viewport {
    return this.#require('viewport');
  }

  get modals(): Modals {
    return this.#require('modals');
  }

  get menu(): Menu {
    return this.#require('menu');
  }

  get rendering(): Rendering {
    return this.#require('rendering');
  }

  get resources(): Resources {
    return this.#require('resources');
  }

  get options(): Options {
    return this.#require('options');
  }

  get respawns(): Respawns {
    return this.#require('respawns');
  }

  get view(): View {
    return this.#require('view');
  }

  get reveal(): Reveal {
    return this.#require('reveal');
  }

  get noises(): Noises {
    return this.#require('noises');
  }

  get weather(): Weather {
    return this.#require('weather');
  }

  get wind(): Wind {
    return this.#require('wind');
  }

  get tracks(): Tracks {
    return this.#require('tracks');
  }

  get lighting(): Lighting {
    return this.#require('lighting');
  }

  get fog(): Fog {
    return this.#require('fog');
  }

  get water(): Water {
    return this.#require('water');
  }

  get materials(): Materials {
    return this.#require('materials');
  }

  get objects(): Objects {
    return this.#require('objects');
  }

  get explosions(): Explosions {
    return this.#require('explosions');
  }

  get world(): World {
    return this.#require('world');
  }

  get RAPIER(): Rapier {
    return this.#require('RAPIER');
  }

  get terrain(): Terrain {
    return this.#require('terrain');
  }

  get physics(): Physics {
    return this.#require('physics');
  }

  get wireframe(): PhysicsWireframe {
    return this.#require('wireframe');
  }

  get physicalVehicle(): PhysicsVehicle {
    return this.#require('physicalVehicle');
  }

  get zones(): Zones {
    return this.#require('zones');
  }

  get player(): Player {
    return this.#require('player');
  }

  get closingManager(): ClosingManager {
    return this.#require('closingManager');
  }

  get interactivePoints(): InteractivePoints {
    return this.#require('interactivePoints');
  }

  get konamiCode(): KonamiCode {
    return this.#require('konamiCode');
  }

  get map(): WorldMap {
    return this.#require('map');
  }

  get title(): Title {
    return this.#require('title');
  }

  get overlay(): Overlay {
    return this.#require('overlay');
  }

  async #start(): Promise<void> {
    await this.#startBoot();
    this.#startIntro();
    await this.#startDrive();
  }

  async #startBoot(): Promise<void> {
    const domElement = this.#provide('domElement', requireElement(document, '.game', HTMLElement));
    this.#provide('canvasElement', requireElement(domElement, '.js-canvas', HTMLCanvasElement));
    document.documentElement.classList.add('is-started');

    this.#provide('scene', new THREE.Scene());
    const resourcesLoader = this.#provide('resourcesLoader', new ResourcesLoader());
    this.#provide('quality', new Quality());
    this.#provide('ticker', new Ticker());
    this.#provide('time', new Time());
    this.#provide('dayCycles', new DayCycles());
    this.#provide('yearCycles', new YearCycles());
    this.#provide('inputs', new Inputs([], ['intro']));
    this.#provide('audio', new Audio());
    this.#provide('notifications', new Notifications());
    this.#provide('rayCursor', new RayCursor());
    this.#provide('viewport', new Viewport(domElement));
    this.#provide('modals', new Modals());
    this.#provide('menu', new Menu());
    const rendering = this.#provide('rendering', new Rendering());
    await rendering.setRenderer();

    this.#provide('resources', await resourcesLoader.load(this.#introResources()));
  }

  #startIntro(): void {
    this.#provide('options', new Options());
    this.#provide('respawns', new Respawns(WORLD_CONFIG.playerSpawn));
    this.#provide('view', new View());
    this.rendering.setPostprocessing();
    this.rendering.start();
    this.#provide('reveal', new Reveal());
    this.#provide('noises', new Noises());
    this.#provide('weather', new Weather());
    this.#provide('wind', new Wind());
    this.#provide('tracks', new Tracks());
    this.#provide('lighting', new Lighting());
    this.#provide('fog', new Fog());
    this.#provide('water', new Water());
    this.#provide('materials', new Materials());
    this.#provide('objects', new Objects());
    this.#provide('explosions', new Explosions());
    this.#provide('world', new World());
  }

  async #startDrive(): Promise<void> {
    const fontsReady = Promise.all(FONT_FACES.map((face) => document.fonts.load(face)));
    const resourcesReady = this.resourcesLoader.load(this.#driveResources(), (remaining, total) => {
      this.world.updateLoadingProgress(1 - remaining / total);
    });
    const [driveResources, rapier] = await Promise.all([resourcesReady, loadRapier(), fontsReady]);

    setStartupStage(STARTUP.graphics);
    this.#provide('RAPIER', rapier);
    this.#provide('resources', { ...driveResources, ...this.resources });
    this.#provide('terrain', new Terrain());
    this.#provide('physics', new Physics());
    this.#provide('wireframe', new PhysicsWireframe());
    this.#provide('physicalVehicle', new PhysicsVehicle());
    this.#provide('zones', new Zones());
    this.#provide('player', new Player());
    this.#provide('closingManager', new ClosingManager());
    this.#provide('interactivePoints', new InteractivePoints());
    this.#provide('konamiCode', new KonamiCode());
    this.#provide('map', new WorldMap());
    this.#provide('title', new Title());
    this.world.step(FIRST_STEP);
    this.#provide('overlay', new Overlay());

    const shouldPreRender = this.quality.level === QUALITY.high && this.rendering.isWebGPU();
    if (shouldPreRender) PreRenderer.render();
    this.ticker.wait(REVEAL_DELAY_FRAMES, () => {
      this.reveal.updateStep(0);
    });
  }

  #introResources(): ResourceSpec[] {
    const { modelSuffix, textureFormat, textureExtension } = assetNames();
    const cb = CACHE_BUSTER;
    return [
      modelResource('respawnsReferencesModel', `respawns/respawnsReferences${modelSuffix}.glb${cb}`),
      textureResource(
        'behindTheSceneStarsTexture',
        `behindTheScene/stars.${textureExtension}${cb}`,
        textureFormat,
        (resource) => {
          resource.colorSpace = THREE.SRGBColorSpace;
          resource.minFilter = THREE.NearestFilter;
          resource.magFilter = THREE.NearestFilter;
          resource.generateMipmaps = false;
          resource.wrapS = THREE.RepeatWrapping;
          resource.wrapT = THREE.RepeatWrapping;
        },
      ),
      textureResource('soundTexture', `intro/sound.${textureExtension}${cb}`, textureFormat, (resource) => {
        resource.minFilter = THREE.LinearFilter;
        resource.magFilter = THREE.LinearFilter;
        resource.generateMipmaps = false;
        resource.repeat.x = 0.5;
      }),
      textureResource('paletteTexture', `palette.${textureExtension}${cb}`, textureFormat, (resource) => {
        resource.minFilter = THREE.NearestFilter;
        resource.magFilter = THREE.NearestFilter;
        resource.generateMipmaps = false;
        resource.colorSpace = THREE.SRGBColorSpace;
      }),
    ];
  }

  #driveResources(): ResourceSpec[] {
    const { modelSuffix, textureFormat, textureExtension } = assetNames();
    const cb = CACHE_BUSTER;
    return [
      textureResource('foliageTexture', `foliage/cherryPetalSDF.png${cb}`, 'texture', (resource) => {
        resource.minFilter = THREE.NearestFilter;
        resource.magFilter = THREE.NearestFilter;
        resource.generateMipmaps = false;
      }),
      modelResource('bushesReferences', `bushes/bushesReferences${modelSuffix}.glb${cb}`),
      modelResource('vehicle', `vehicle/default${modelSuffix}.glb${cb}`),
      modelResource('playgroundVisual', `playground/playgroundVisual${modelSuffix}.glb${cb}`),
      modelResource('playgroundPhysical', `playground/playgroundPhysical${modelSuffix}.glb${cb}`),
      modelResource('flowersReferencesModel', `flowers/flowersReferences${modelSuffix}.glb${cb}`),
      modelResource('bricksModel', `bricks/bricks${modelSuffix}.glb${cb}`),
      modelResource('fencesModel', `fences/fences${modelSuffix}.glb${cb}`),
      modelResource('benchesModel', `benches/benches${modelSuffix}.glb${cb}`),
      modelResource('explosiveCratesModel', `explosiveCrates/explosiveCrates${modelSuffix}.glb${cb}`),
      modelResource('lanternsModel', `lanterns/lanterns${modelSuffix}.glb${cb}`),
      textureResource('terrainTexture', `terrain/terrain.${textureExtension}${cb}`, textureFormat, (resource) => {
        resource.flipY = false;
      }),
      modelResource('terrainModel', `terrain/terrain${modelSuffix}.glb${cb}`),
      textureResource('floorSlabsTexture', `floor/slabs.${textureExtension}`, textureFormat, (resource) => {
        resource.wrapS = THREE.RepeatWrapping;
        resource.wrapT = THREE.RepeatWrapping;
        resource.minFilter = THREE.LinearFilter;
        resource.magFilter = THREE.LinearFilter;
        resource.generateMipmaps = false;
      }),
      modelResource('birchTreesVisualModel', `birchTrees/birchTreesVisual${modelSuffix}.glb${cb}`),
      modelResource('birchTreesReferencesModel', `birchTrees/birchTreesReferences${modelSuffix}.glb${cb}`),
      modelResource('oakTreesVisualModel', `oakTrees/oakTreesVisual${modelSuffix}.glb${cb}`),
      modelResource('oakTreesReferencesModel', `oakTrees/oakTreesReferences${modelSuffix}.glb${cb}`),
      modelResource('cherryTreesVisualModel', `cherryTrees/cherryTreesVisual${modelSuffix}.glb${cb}`),
      modelResource('cherryTreesReferencesModel', `cherryTrees/cherryTreesReferences${modelSuffix}.glb${cb}`),
      modelResource('sceneryModel', `scenery/scenery${modelSuffix}.glb${cb}`),
      modelResource('areasModel', `areas/areas${modelSuffix}.glb${cb}`),
      modelResource('poleLightsModel', `poleLights/poleLights${modelSuffix}.glb${cb}`),
      textureResource('satanStarTexture', `areas/lotusMark.png${cb}`, 'texture', (resource) => {
        resource.minFilter = THREE.LinearFilter;
        resource.magFilter = THREE.LinearFilter;
        resource.generateMipmaps = false;
      }),
      textureResource(
        'overlayPatternTexture',
        `overlay/overlayPattern.${textureExtension}${cb}`,
        textureFormat,
        (resource) => {
          resource.wrapS = THREE.RepeatWrapping;
          resource.wrapT = THREE.RepeatWrapping;
          resource.magFilter = THREE.NearestFilter;
          resource.minFilter = THREE.NearestFilter;
          resource.generateMipmaps = false;
        },
      ),
      textureResource(
        'interactivePointsKeyIconCrossTexture',
        `interactivePoints/interactivePointsKeyIconCross.${textureExtension}${cb}`,
        textureFormat,
        (resource) => {
          resource.minFilter = THREE.NearestFilter;
          resource.magFilter = THREE.NearestFilter;
          resource.generateMipmaps = false;
        },
      ),
      textureResource(
        'interactivePointsKeyIconEnterTexture',
        `interactivePoints/interactivePointsKeyIconEnter.${textureExtension}${cb}`,
        textureFormat,
        (resource) => {
          resource.minFilter = THREE.NearestFilter;
          resource.magFilter = THREE.NearestFilter;
          resource.generateMipmaps = false;
        },
      ),
      textureResource(
        'interactivePointsKeyIconATexture',
        `interactivePoints/interactivePointsKeyIconA.${textureExtension}${cb}`,
        textureFormat,
        (resource) => {
          resource.minFilter = THREE.NearestFilter;
          resource.magFilter = THREE.NearestFilter;
          resource.generateMipmaps = false;
        },
      ),
      textureResource('islandMapTexture', `areas/island/islandMap.webp${cb}`, 'texture', (resource) => {
        resource.colorSpace = THREE.SRGBColorSpace;
      }),
      textureResource('bowlingNeonTexture', `bowling/neonSign.png${cb}`, 'texture', (resource) => {
        resource.colorSpace = THREE.SRGBColorSpace;
        resource.generateMipmaps = false;
        resource.minFilter = THREE.LinearFilter;
      }),
      textureResource(
        'jukeboxMusicNotes',
        `jukebox/jukeboxMusicNotes.${textureExtension}${cb}`,
        textureFormat,
        (resource) => {
          resource.minFilter = THREE.LinearFilter;
          resource.magFilter = THREE.LinearFilter;
          resource.generateMipmaps = false;
        },
      ),
      textureResource(
        'achievementsGlyphsTexture',
        `achievements/glyphs.${textureExtension}${cb}`,
        textureFormat,
        (resource) => {
          resource.minFilter = THREE.LinearFilter;
          resource.magFilter = THREE.LinearFilter;
          resource.generateMipmaps = false;
          resource.wrapS = THREE.RepeatWrapping;
        },
      ),
      textureResource(
        'careerFreelancerTexture',
        `career/careerFreelancer.${textureExtension}${cb}`,
        textureFormat,
        (resource) => {
          resource.flipY = false;
          resource.minFilter = THREE.LinearFilter;
          resource.magFilter = THREE.LinearFilter;
          resource.generateMipmaps = false;
          resource.wrapS = THREE.ClampToEdgeWrapping;
          resource.wrapT = THREE.ClampToEdgeWrapping;
        },
      ),
      textureResource(
        'careerHeticTexture',
        `career/careerHetic.${textureExtension}${cb}`,
        textureFormat,
        (resource) => {
          resource.flipY = false;
          resource.minFilter = THREE.LinearFilter;
          resource.magFilter = THREE.LinearFilter;
          resource.generateMipmaps = false;
          resource.wrapS = THREE.ClampToEdgeWrapping;
          resource.wrapT = THREE.ClampToEdgeWrapping;
        },
      ),
      textureResource(
        'careerImmersiveGardenTexture',
        `career/careerImmersiveGarden.${textureExtension}${cb}`,
        textureFormat,
        (resource) => {
          resource.flipY = false;
          resource.minFilter = THREE.LinearFilter;
          resource.magFilter = THREE.LinearFilter;
          resource.generateMipmaps = false;
          resource.wrapS = THREE.ClampToEdgeWrapping;
          resource.wrapT = THREE.ClampToEdgeWrapping;
        },
      ),
      textureResource(
        'careerIRLTeacherTexture',
        `career/careerIRLTeacher.${textureExtension}${cb}`,
        textureFormat,
        (resource) => {
          resource.flipY = false;
          resource.minFilter = THREE.LinearFilter;
          resource.magFilter = THREE.LinearFilter;
          resource.generateMipmaps = false;
          resource.wrapS = THREE.ClampToEdgeWrapping;
          resource.wrapT = THREE.ClampToEdgeWrapping;
        },
      ),
      textureResource(
        'careerOnlineTeacherTexture',
        `career/careerOnlineTeacher.${textureExtension}${cb}`,
        textureFormat,
        (resource) => {
          resource.flipY = false;
          resource.minFilter = THREE.LinearFilter;
          resource.magFilter = THREE.LinearFilter;
          resource.generateMipmaps = false;
          resource.wrapS = THREE.ClampToEdgeWrapping;
          resource.wrapT = THREE.ClampToEdgeWrapping;
        },
      ),
      textureResource('careerUzikTexture', `career/careerUzik.${textureExtension}${cb}`, textureFormat, (resource) => {
        resource.flipY = false;
        resource.minFilter = THREE.LinearFilter;
        resource.magFilter = THREE.LinearFilter;
        resource.generateMipmaps = false;
        resource.wrapS = THREE.ClampToEdgeWrapping;
        resource.wrapT = THREE.ClampToEdgeWrapping;
      }),
      textureResource(
        'timeMachineScreenMGSTexture',
        `timeMachine/timeMachineScreenMGS.${textureExtension}${cb}`,
        textureFormat,
        (resource) => {
          resource.minFilter = THREE.NearestFilter;
          resource.magFilter = THREE.NearestFilter;
          resource.generateMipmaps = false;
          resource.wrapS = THREE.ClampToEdgeWrapping;
          resource.wrapT = THREE.ClampToEdgeWrapping;
          resource.colorSpace = THREE.SRGBColorSpace;
        },
      ),
      textureResource(
        'timeMachineScreenFolioTexture',
        `timeMachine/timeMachineScreenFolio.${textureExtension}${cb}`,
        textureFormat,
        (resource) => {
          resource.minFilter = THREE.NearestFilter;
          resource.magFilter = THREE.NearestFilter;
          resource.generateMipmaps = false;
          resource.wrapS = THREE.ClampToEdgeWrapping;
          resource.wrapT = THREE.ClampToEdgeWrapping;
          resource.colorSpace = THREE.SRGBColorSpace;
        },
      ),
      ...islandTextureResources(cb),
      ...islandModelResources(cb),
    ];
  }

  reset(): void {
    this.inputs.clearInteractiveButtons();
    this.player.respawn(undefined, () => {
      this.objects.resetAll();
      this.world.refreshAfterReset();
    });
  }
}
