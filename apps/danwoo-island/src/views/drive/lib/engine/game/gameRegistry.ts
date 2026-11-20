import type { GameSystems } from '@views/drive/lib/engine/game/gameSystems';

export class GameRegistry {
  readonly #systems: Partial<GameSystems> = {};

  protected provide<K extends keyof GameSystems>(key: K, value: GameSystems[K]): GameSystems[K] {
    this.#systems[key] = value;
    return value;
  }

  protected require<K extends keyof GameSystems>(key: K): GameSystems[K] {
    const value = this.#systems[key];
    if (value === undefined) throw new Error(`Game.${key} is not ready`);
    return value;
  }

  get domElement(): GameSystems['domElement'] {
    return this.require('domElement');
  }

  get canvasElement(): GameSystems['canvasElement'] {
    return this.require('canvasElement');
  }

  get scene(): GameSystems['scene'] {
    return this.require('scene');
  }

  get resourcesLoader(): GameSystems['resourcesLoader'] {
    return this.require('resourcesLoader');
  }

  get quality(): GameSystems['quality'] {
    return this.require('quality');
  }

  get ticker(): GameSystems['ticker'] {
    return this.require('ticker');
  }

  get time(): GameSystems['time'] {
    return this.require('time');
  }

  get dayCycles(): GameSystems['dayCycles'] {
    return this.require('dayCycles');
  }

  get yearCycles(): GameSystems['yearCycles'] {
    return this.require('yearCycles');
  }

  get inputs(): GameSystems['inputs'] {
    return this.require('inputs');
  }

  get audio(): GameSystems['audio'] {
    return this.require('audio');
  }

  get notifications(): GameSystems['notifications'] {
    return this.require('notifications');
  }

  get rayCursor(): GameSystems['rayCursor'] {
    return this.require('rayCursor');
  }

  get viewport(): GameSystems['viewport'] {
    return this.require('viewport');
  }

  get modals(): GameSystems['modals'] {
    return this.require('modals');
  }

  get menu(): GameSystems['menu'] {
    return this.require('menu');
  }

  get rendering(): GameSystems['rendering'] {
    return this.require('rendering');
  }

  get resources(): GameSystems['resources'] {
    return this.require('resources');
  }

  get options(): GameSystems['options'] {
    return this.require('options');
  }

  get respawns(): GameSystems['respawns'] {
    return this.require('respawns');
  }

  get view(): GameSystems['view'] {
    return this.require('view');
  }

  get reveal(): GameSystems['reveal'] {
    return this.require('reveal');
  }

  get noises(): GameSystems['noises'] {
    return this.require('noises');
  }

  get weather(): GameSystems['weather'] {
    return this.require('weather');
  }

  get wind(): GameSystems['wind'] {
    return this.require('wind');
  }

  get tracks(): GameSystems['tracks'] {
    return this.require('tracks');
  }

  get lighting(): GameSystems['lighting'] {
    return this.require('lighting');
  }

  get fog(): GameSystems['fog'] {
    return this.require('fog');
  }

  get water(): GameSystems['water'] {
    return this.require('water');
  }

  get materials(): GameSystems['materials'] {
    return this.require('materials');
  }

  get objects(): GameSystems['objects'] {
    return this.require('objects');
  }

  get explosions(): GameSystems['explosions'] {
    return this.require('explosions');
  }

  get world(): GameSystems['world'] {
    return this.require('world');
  }

  get RAPIER(): GameSystems['RAPIER'] {
    return this.require('RAPIER');
  }

  get terrain(): GameSystems['terrain'] {
    return this.require('terrain');
  }

  get physics(): GameSystems['physics'] {
    return this.require('physics');
  }

  get physicalVehicle(): GameSystems['physicalVehicle'] {
    return this.require('physicalVehicle');
  }

  get zones(): GameSystems['zones'] {
    return this.require('zones');
  }

  get player(): GameSystems['player'] {
    return this.require('player');
  }

  get closingManager(): GameSystems['closingManager'] {
    return this.require('closingManager');
  }

  get interactivePoints(): GameSystems['interactivePoints'] {
    return this.require('interactivePoints');
  }

  get konamiCode(): GameSystems['konamiCode'] {
    return this.require('konamiCode');
  }

  get map(): GameSystems['map'] {
    return this.require('map');
  }

  get title(): GameSystems['title'] {
    return this.require('title');
  }

  get overlay(): GameSystems['overlay'] {
    return this.require('overlay');
  }
}
