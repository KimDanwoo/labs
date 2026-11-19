import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three/webgpu';

import { setStartupStage, STARTUP } from '../islandStartup';
import { WORLD_CONFIG } from '../worldConfig';
import { Audio } from './audio';
import { ClosingManager } from './closingManager';
import { DayCycles } from './cycles/dayCycles';
import { YearCycles } from './cycles/yearCycles';
import { exposeDevProbe } from './devProbe';
import { Explosions } from './explosions';
import { Fog } from './fog';
import { bindGame } from './gameContext';
import { GameRegistry } from './gameRegistry';
import { driveResources, introResources } from './gameResources';
import { loadRapier } from './gameSystems';
import { Inputs } from './inputs/inputs';
import { InteractivePoints } from './interactivePoints';
import { KonamiCode } from './konamiCode';
import { Lighting } from './lighting';
import { WorldMap } from './map';
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
import { Player } from './player';
import { preRender } from './preRenderer';
import { QUALITY, Quality } from './quality';
import { RayCursor } from './rayCursor';
import { Rendering } from './rendering';
import { isModel, ResourcesLoader } from './resourcesLoader';
import { Respawns } from './respawns';
import { Reveal } from './reveal';
import { Terrain } from './terrain';
import { Ticker } from './ticker';
import { TICK_ORDER } from './tickOrder';
import { Time } from './time';
import { Title } from './title';
import { Tracks } from './tracks';
import { requireElement } from './utilities/requireElement';
import { View } from './view';
import { Viewport } from './viewport';
import { Water } from './water';
import { Weather } from './weather';
import { Wind } from './wind';
import { World } from './world/world';
import { Zones } from './zones';

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
    if (!resource || !isModel(resource)) throw new Error(`Model ${name} is not loaded`);
    return resource;
  }

  texture(name: string): THREE.Texture {
    const resource = this.resources[name];
    if (!resource || isModel(resource)) throw new Error(`Texture ${name} is not loaded`);
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
    this.provide('viewport', new Viewport(domElement));
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

    const shouldPreRender = this.quality.level === QUALITY.high && this.rendering.isWebGPU();
    if (shouldPreRender) preRender();
    this.ticker.wait(REVEAL_DELAY_FRAMES, () => {
      this.reveal.start();
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
