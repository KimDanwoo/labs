import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three/webgpu';

import { Audio } from '@views/drive/lib/engine/game/audio';
import { ClosingManager } from '@views/drive/lib/engine/game/closingManager';
import { DayCycles } from '@views/drive/lib/engine/game/cycles/dayCycles';
import { YearCycles } from '@views/drive/lib/engine/game/cycles/yearCycles';
import { exposeDevProbe } from '@views/drive/lib/engine/game/devProbe';
import { Explosions } from '@views/drive/lib/engine/game/explosions';
import { Fog } from '@views/drive/lib/engine/game/fog';
import { bindGame } from '@views/drive/lib/engine/game/gameContext';
import { GameRegistry } from '@views/drive/lib/engine/game/gameRegistry';
import { driveResources, introResources } from '@views/drive/lib/engine/game/gameResources';
import { loadRapier } from '@views/drive/lib/engine/game/gameSystems';
import { Inputs } from '@views/drive/lib/engine/game/inputs/inputs';
import { InteractivePoints } from '@views/drive/lib/engine/game/interactivePoints';
import { KonamiCode } from '@views/drive/lib/engine/game/konamiCode';
import { Lighting } from '@views/drive/lib/engine/game/lighting';
import { WorldMap } from '@views/drive/lib/engine/game/map';
import { Materials } from '@views/drive/lib/engine/game/materials';
import { Menu } from '@views/drive/lib/engine/game/menu';
import { Modals } from '@views/drive/lib/engine/game/modals';
import { Noises } from '@views/drive/lib/engine/game/noises';
import { Notifications } from '@views/drive/lib/engine/game/notifications';
import { Objects } from '@views/drive/lib/engine/game/objects';
import { Options } from '@views/drive/lib/engine/game/options';
import { Overlay } from '@views/drive/lib/engine/game/overlay';
import { Physics } from '@views/drive/lib/engine/game/physics/physics';
import { PhysicsVehicle } from '@views/drive/lib/engine/game/physics/physicsVehicle';
import { Player } from '@views/drive/lib/engine/game/player';
import { QUALITY, Quality } from '@views/drive/lib/engine/game/quality';
import { RayCursor } from '@views/drive/lib/engine/game/rayCursor';
import { Rendering } from '@views/drive/lib/engine/game/rendering';
import { isModel, ResourcesLoader } from '@views/drive/lib/engine/game/resourcesLoader';
import { Respawns } from '@views/drive/lib/engine/game/respawns';
import { Reveal } from '@views/drive/lib/engine/game/reveal';
import { Terrain } from '@views/drive/lib/engine/game/terrain';
import { Ticker } from '@views/drive/lib/engine/game/ticker';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';
import { Time } from '@views/drive/lib/engine/game/time';
import { Title } from '@views/drive/lib/engine/game/title';
import { Tracks } from '@views/drive/lib/engine/game/tracks';
import { requireElement } from '@views/drive/lib/engine/game/utilities/requireElement';
import { View } from '@views/drive/lib/engine/game/view';
import { Viewport } from '@views/drive/lib/engine/game/viewport';
import { Water } from '@views/drive/lib/engine/game/water';
import { Weather } from '@views/drive/lib/engine/game/weather';
import { Wind } from '@views/drive/lib/engine/game/wind';
import { World } from '@views/drive/lib/engine/game/world/world';
import { Zones } from '@views/drive/lib/engine/game/zones';
import { setStartupStage, STARTUP } from '@views/drive/lib/engine/islandStartup';
import { WORLD_CONFIG } from '@views/drive/lib/engine/worldConfig';

const REVEAL_DELAY_FRAMES = 3;
const FONT_FACES = ['400 24px MaruBuri', '700 24px MaruBuri'];
const FONT_SAMPLE = '김단우 섬 Aa1';

export class Game extends GameRegistry {
  constructor() {
    super();
    bindGame(this);
    exposeDevProbe(this);
    this.#start().catch((error: unknown) => {
      setStartupStage(STARTUP.error);
      reportError(error);
    });
  }

  model(name: string): GLTF {
    const resource = this.resources[name];
    if (!resource) throw new Error(`Model ${name} is not loaded`);
    if (!isModel(resource)) throw new Error(`Model ${name} is not loaded`);
    return resource;
  }

  texture(name: string): THREE.Texture {
    const resource = this.resources[name];
    if (!resource) throw new Error(`Texture ${name} is not loaded`);
    if (isModel(resource)) throw new Error(`Texture ${name} is not loaded`);
    return resource;
  }

  async #start(): Promise<void> {
    await this.#startBoot();
    this.#startIntro();
    await this.#startDrive();
  }

  async #startBoot(): Promise<void> {
    const domElement = this.provide('domElement', requireElement(document, '.game', HTMLElement));
    this.provide('canvasElement', requireElement(domElement, '.js-canvas', HTMLCanvasElement));
    document.documentElement.classList.add('is-started');

    this.provide('scene', new THREE.Scene());
    const resourcesLoader = this.provide('resourcesLoader', new ResourcesLoader());
    this.provide('quality', new Quality());
    this.provide('ticker', new Ticker());
    this.provide('time', new Time());
    this.ticker.events.on('tick', () => this.quality.observeFrame(this.ticker), TICK_ORDER.quality);
    this.provide('dayCycles', new DayCycles());
    this.provide('yearCycles', new YearCycles());
    this.provide('inputs', new Inputs([], ['intro']));
    this.provide('audio', new Audio());
    this.provide('notifications', new Notifications());
    this.provide('rayCursor', new RayCursor());
    this.provide('viewport', new Viewport(domElement, this.quality.level));
    this.quality.events.on('change', (level) => this.viewport.applyQuality(level));
    this.provide('modals', new Modals());
    this.provide('menu', new Menu());
    const rendering = this.provide('rendering', new Rendering());
    await rendering.setRenderer();

    this.provide('resources', await resourcesLoader.load(introResources()));
  }

  #startIntro(): void {
    this.provide('options', new Options());
    this.provide('respawns', new Respawns(WORLD_CONFIG.playerSpawn));
    this.provide('view', new View());
    this.rendering.setPostprocessing();
    this.rendering.start();
    this.provide('reveal', new Reveal());
    this.provide('noises', new Noises());
    this.provide('weather', new Weather());
    this.provide('wind', new Wind());
    this.provide('tracks', new Tracks());
    this.provide('lighting', new Lighting());
    this.provide('fog', new Fog());
    this.provide('water', new Water());
    this.provide('materials', new Materials());
    this.provide('objects', new Objects());
    this.provide('explosions', new Explosions());
    this.provide('world', new World());
  }

  async #startDrive(): Promise<void> {
    const fontsReady = Promise.all(FONT_FACES.map((face) => document.fonts.load(face, FONT_SAMPLE)));
    const resourcesReady = this.resourcesLoader.load(driveResources(), (remaining, total) => {
      this.world.updateLoadingProgress(1 - remaining / total);
    });
    const [loadedResources, rapier] = await Promise.all([resourcesReady, loadRapier(), fontsReady]);

    setStartupStage(STARTUP.graphics);
    this.provide('RAPIER', rapier);
    this.provide('resources', { ...loadedResources, ...this.resources });
    this.provide('terrain', new Terrain());
    this.provide('physics', new Physics());
    this.provide('physicalVehicle', new PhysicsVehicle());
    this.provide('zones', new Zones());
    this.provide('player', new Player());
    this.provide('closingManager', new ClosingManager());
    this.provide('interactivePoints', new InteractivePoints());
    this.provide('konamiCode', new KonamiCode());
    this.provide('map', new WorldMap());
    this.provide('title', new Title());
    this.world.populate();
    this.provide('overlay', new Overlay());

    const isHighQuality = this.quality.level === QUALITY.high;
    const shouldPrecompile = isHighQuality && this.rendering.isWebGPU();
    if (shouldPrecompile) await this.rendering.precompile().catch(reportError);
    const onLabelShown = (): void => {
      if (shouldPrecompile) void this.rendering.precompileOffscreen().catch(reportError);
    };
    this.ticker.wait(REVEAL_DELAY_FRAMES, () => {
      this.reveal.start(onLabelShown);
    });
  }

  reset(): void {
    this.inputs.clearInteractiveButtons();
    this.player.respawn(undefined, () => {
      this.objects.resetAll();
      this.world.refreshAfterReset();
    });
  }
}
