import { worldAsset } from '../../../config/worldAsset';
import { getGame } from './gameContext';
import type { ModalItem } from './modals';
import { createElement } from './utilities/createElement';
import { clamp } from './utilities/maths';
import { requireElement } from './utilities/requireElement';

interface MapLocation {
  name: string;
  respawnName: string;
  offset: { x: number; y: number };
}

interface MapPoint {
  x: number;
  y: number;
}

const LOCATIONS: readonly MapLocation[] = [
  { name: '서핑 포인트', respawnName: 'altar', offset: { x: 0, y: -0.05 } },
  { name: '공사장', respawnName: 'behindTheScene', offset: { x: 0.01, y: 0 } },
  { name: '볼링장', respawnName: 'bowling', offset: { x: -0.08, y: 0.03 } },
  { name: '소개·이력서', respawnName: 'career', offset: { x: 0, y: -0.06 } },
  { name: '서킷', respawnName: 'circuit', offset: { x: -0.08, y: -0.05 } },
  { name: '코코넛 노점', respawnName: 'cookie', offset: { x: -0.02, y: -0.01 } },
  { name: 'Danwoo Lab', respawnName: 'lab', offset: { x: -0.03, y: 0 } },
  { name: '출발점', respawnName: 'landing', offset: { x: 0.02, y: 0 } },
  { name: '프로젝트', respawnName: 'projects', offset: { x: 0, y: -0.02 } },
  { name: '소셜', respawnName: 'social', offset: { x: -0.01, y: -0.04 } },
  { name: 'Lab 포털', respawnName: 'timeMachine', offset: { x: 0, y: 0 } },
];
const MAP_IMAGES = { day: 'ui/map/map-day.webp', night: 'ui/map/map-night.webp' } as const;
const MAP_ACTION = { name: 'map', categories: ['modal', 'menu', 'wandering'], keys: ['Keyboard.m', 'Keyboard.KeyM'] };
const Z_INDEX_SCALE = 1000;
const PERCENT_PRECISION = 10;
const TICK_ORDER = 14;

function toLines(text: string): (string | HTMLElement)[] {
  return text.split('\n').flatMap((line, index) => (index === 0 ? [line] : [document.createElement('br'), line]));
}

function worldToMap(x: number, z: number): MapPoint {
  const { size } = getGame().terrain;
  return { x: clamp(x / size + 0.5, 0, 1), y: clamp(z / size + 0.5, 0, 1) };
}

function toPercent(ratio: number): number {
  return Math.round(ratio * 100 * PERCENT_PRECISION) / PERCENT_PRECISION;
}

export class WorldMap {
  readonly #modal: ModalItem;
  readonly #container: HTMLElement;
  readonly #playerElement: HTMLElement;
  readonly #textureElement: HTMLImageElement;
  readonly #roundedPlayer = { x: 0, z: 0 };
  #isInitiated = false;
  #textureUrl: string | null = null;

  constructor() {
    const game = getGame();
    const modal = game.modals.items.get('map');
    if (!modal) throw new Error('Map modal is missing');
    this.#modal = modal;
    this.#container = requireElement(modal.element, '.js-map-container', HTMLElement);
    this.#playerElement = requireElement(this.#container, '.js-player', HTMLElement);
    this.#textureElement = requireElement(this.#container, '.js-texture', HTMLImageElement);
    this.#bindTrigger();
    this.#bindInput();
    modal.events.on('open', () => {
      if (!this.#isInitiated) this.#init();
      this.#updateTexture();
    });
  }

  #init(): void {
    this.#isInitiated = true;
    for (const location of LOCATIONS) this.#container.append(this.#locationElement(location));
    this.#textureElement.addEventListener('load', () => this.#textureElement.classList.add('is-visible'));
    getGame().ticker.events.on('tick', () => this.update(), TICK_ORDER);
  }

  #locationElement({ name, respawnName, offset }: MapLocation): HTMLElement {
    const game = getGame();
    const { position } = game.respawns.getByName(respawnName);
    const point = worldToMap(position.x, position.z);
    const element = createElement('div', 'location', [
      createElement('div', 'pin'),
      createElement('div', 'name-container', [createElement('div', 'name', toLines(name))]),
    ]);
    element.style.left = `${(point.x + offset.x) * 100}%`;
    element.style.top = `${(point.y + offset.y) * 100}%`;
    element.style.zIndex = String(Math.round(point.y * Z_INDEX_SCALE));
    element.addEventListener('click', () => {
      game.player.respawn(respawnName, () => {
        game.view.focusPoint.isTracking = true;
      });
      game.modals.close();
    });
    return element;
  }

  #updateTexture(): void {
    const url = getGame().dayCycles.isInInterval('night') ? MAP_IMAGES.night : MAP_IMAGES.day;
    if (url === this.#textureUrl) return;
    this.#textureElement.classList.remove('is-visible');
    this.#textureUrl = url;
    this.#textureElement.src = worldAsset(url);
  }

  #bindTrigger(): void {
    const { domElement, modals } = getGame();
    const trigger = requireElement(domElement, '.js-map-trigger', HTMLElement);
    trigger.addEventListener('click', () => modals.open('map'));
    trigger.addEventListener('keydown', (event) => event.preventDefault());
  }

  #bindInput(): void {
    const { inputs, modals } = getGame();
    inputs.addActions([MAP_ACTION]);
    inputs.events.on('map', (action) => {
      if (!action.active) return;
      if (this.#modal.isOpen) modals.close();
      else modals.open('map');
    });
  }

  update(): void {
    if (!this.#modal.isOpen) return;
    const { player, physicalVehicle } = getGame();
    const x = Math.round(player.position.x);
    const z = Math.round(player.position.z);
    if (x === this.#roundedPlayer.x && z === this.#roundedPlayer.z) return;

    this.#roundedPlayer.x = x;
    this.#roundedPlayer.z = z;
    const point = worldToMap(x, z);
    this.#playerElement.style.left = `${toPercent(point.x)}%`;
    this.#playerElement.style.top = `${toPercent(point.y)}%`;
    this.#playerElement.style.transform = `rotate(${-physicalVehicle.yRotation}rad)`;
  }
}
