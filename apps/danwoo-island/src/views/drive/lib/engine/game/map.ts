import { worldAsset } from '../../../config/worldAsset';
import { getGame } from './gameContext';
import type { ModalItem } from './modals';
import { createElement } from './utilities/createElement';
import { clamp } from './utilities/maths';
import { requireElement } from './utilities/requireElement';

type MapIcon =
  | 'projects'
  | 'lab'
  | 'career'
  | 'social'
  | 'circuit'
  | 'bowling'
  | 'cookie'
  | 'surf'
  | 'construction'
  | 'portal'
  | 'start';

interface MapLocation {
  name: string;
  respawnName: string;
  icon: MapIcon;
  offset: { x: number; y: number };
}

interface MapPoint {
  x: number;
  y: number;
}

const LOCATIONS: readonly MapLocation[] = [
  { name: '프로젝트', respawnName: 'projects', icon: 'projects', offset: { x: 0, y: -0.02 } },
  { name: 'Danwoo Lab', respawnName: 'lab', icon: 'lab', offset: { x: -0.03, y: 0 } },
  { name: '소개·이력서', respawnName: 'career', icon: 'career', offset: { x: 0, y: -0.06 } },
  { name: '소셜', respawnName: 'social', icon: 'social', offset: { x: -0.01, y: -0.04 } },
  { name: '서킷', respawnName: 'circuit', icon: 'circuit', offset: { x: -0.08, y: -0.05 } },
  { name: '볼링장', respawnName: 'bowling', icon: 'bowling', offset: { x: -0.08, y: 0.03 } },
  { name: '코코넛 노점', respawnName: 'cookie', icon: 'cookie', offset: { x: -0.02, y: -0.01 } },
  { name: '서핑 포인트', respawnName: 'altar', icon: 'surf', offset: { x: 0, y: -0.05 } },
  { name: '공사장', respawnName: 'behindTheScene', icon: 'construction', offset: { x: 0.01, y: 0 } },
  { name: 'Lab 포털', respawnName: 'timeMachine', icon: 'portal', offset: { x: 0, y: 0 } },
  { name: '출발점', respawnName: 'beachStart', icon: 'start', offset: { x: 0, y: 0 } },
];
const MAP_IMAGES = { day: 'ui/map/map-day.webp', night: 'ui/map/map-night.webp' } as const;
const MAP_ACTION = { name: 'map', categories: ['modal', 'menu', 'wandering'], keys: ['Keyboard.m', 'Keyboard.KeyM'] };
const Z_INDEX_SCALE = 1000;
const LABEL_FLIP_X = 0.78;
const PERCENT_PRECISION = 10;
const TICK_ORDER = 14;

function iconElement(icon: MapIcon, className: string): HTMLImageElement {
  const image = createElement('img', className);
  image.src = worldAsset(`ui/map/icons/${icon}.webp`);
  image.alt = '';
  return image;
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
  readonly #placesElement: HTMLElement;
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
    this.#placesElement = requireElement(modal.element, '.js-map-places', HTMLElement);
    this.#bindTrigger();
    this.#bindInput();
    modal.events.on('open', () => {
      if (!this.#isInitiated) this.#init();
      this.#updateTexture();
    });
  }

  #init(): void {
    this.#isInitiated = true;
    for (const location of LOCATIONS) {
      this.#container.append(this.#pinElement(location));
      this.#placesElement.append(this.#placeElement(location));
    }
    this.#textureElement.addEventListener('load', () => this.#textureElement.classList.add('is-visible'));
    getGame().ticker.events.on('tick', () => this.update(), TICK_ORDER);
  }

  #travelTo(respawnName: string): void {
    const game = getGame();
    game.player.respawn(respawnName, () => {
      game.view.focusPoint.isTracking = true;
    });
    game.modals.close();
  }

  #pinElement({ name, respawnName, icon, offset }: MapLocation): HTMLElement {
    const { position } = getGame().respawns.getByName(respawnName);
    const point = worldToMap(position.x, position.z);
    const element = createElement('button', 'location', [
      iconElement(icon, 'pin'),
      createElement('span', 'name', [name]),
    ]);
    element.type = 'button';
    element.setAttribute('aria-label', `${name}(으)로 이동`);
    if (point.x + offset.x > LABEL_FLIP_X) element.classList.add('is-label-left');
    element.style.left = `${(point.x + offset.x) * 100}%`;
    element.style.top = `${(point.y + offset.y) * 100}%`;
    element.style.zIndex = String(Math.round(point.y * Z_INDEX_SCALE));
    element.addEventListener('click', () => this.#travelTo(respawnName));
    return element;
  }

  #placeElement({ name, respawnName, icon }: MapLocation): HTMLElement {
    const button = createElement('button', 'map-place', [iconElement(icon, 'map-place-icon'), name]);
    button.type = 'button';
    button.addEventListener('click', () => this.#travelTo(respawnName));
    return createElement('li', '', [button]);
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
