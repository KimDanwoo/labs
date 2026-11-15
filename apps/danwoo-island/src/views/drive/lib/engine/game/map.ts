import gsap from 'gsap';
import * as THREE from 'three/webgpu';

import { worldAsset } from '../../../config/worldAsset';
import { getGame } from './gameContext';
import { ISLAND_PLACES, type IslandPlace, type PlaceIcon } from './islandPlaces';
import type { ModalItem } from './modals';
import { createElement } from './utilities/createElement';
import { requireElement } from './utilities/requireElement';
import type { OverviewFrame, ScreenInsets } from './view/overviewFrame';

const MAP_ACTION = { name: 'map', categories: ['modal', 'menu', 'wandering'], keys: ['Keyboard.m', 'Keyboard.KeyM'] };
const PIN_LIFT = 1.6;
const FLIGHT = { rise: 1.3, land: 1.5, ease: 'power3.inOut' } as const;
const TICK_ORDER = 14;
const HIDDEN_CLASS = 'is-hidden';
const SELECTED_CLASS = 'is-selected';
const COMPACT_SCREEN = { width: 720, height: 500 } as const;
const REFRAME_DURATION = 0.3;
const FRAME_INSETS = {
  wide: { top: 130, right: 290, bottom: 75, left: 60 },
  compact: { top: 130, right: 125, bottom: 75, left: 40 },
} as const satisfies Record<string, ScreenInsets>;

interface Pin {
  readonly place: IslandPlace;
  readonly element: HTMLElement;
  readonly anchor: THREE.Vector3;
}

function iconElement(icon: PlaceIcon, className: string): HTMLImageElement {
  const image = createElement('img', className);
  image.src = worldAsset(`ui/map/icons/${icon}.webp`);
  image.alt = '';
  return image;
}

export class WorldMap {
  readonly #modal: ModalItem;
  readonly #pinsElement: HTMLElement;
  readonly #placesElement: HTMLElement;
  readonly #carElement: HTMLElement;
  readonly #card: { root: HTMLElement; icon: HTMLImageElement; title: HTMLElement; text: HTMLElement; go: HTMLElement };
  readonly #projected = new THREE.Vector3();
  readonly #placements = new WeakMap<HTMLElement, string>();
  #pins: Pin[] = [];
  #selected: IslandPlace | null = null;
  #destination: IslandPlace | null = null;

  constructor() {
    const game = getGame();
    const modal = game.modals.items.get('map');
    if (!modal) throw new Error('Map modal is missing');
    this.#modal = modal;
    const root = modal.element;
    this.#pinsElement = requireElement(root, '.js-map-pins', HTMLElement);
    this.#placesElement = requireElement(root, '.js-map-places', HTMLElement);
    this.#carElement = requireElement(root, '.js-map-car', HTMLElement);
    this.#card = {
      root: requireElement(root, '.js-map-card', HTMLElement),
      icon: requireElement(root, '.js-map-card-icon', HTMLImageElement),
      title: requireElement(root, '.js-map-card-title', HTMLElement),
      text: requireElement(root, '.js-map-card-text', HTMLElement),
      go: requireElement(root, '.js-map-card-go', HTMLElement),
    };
    this.#card.go.addEventListener('click', () => {
      if (this.#selected) this.#travelTo(this.#selected);
    });
    this.#bindTrigger();
    this.#bindInput();
    modal.events.on('open', () => this.#rise());
    modal.events.on('close', () => this.#land());
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
    game.viewport.events.on('change', () => this.#reframe());
  }

  #ensurePins(): void {
    if (this.#pins.length > 0) return;
    const { respawns } = getGame();
    this.#pins = ISLAND_PLACES.map((place) => {
      const element = createElement('button', 'map-pin', [
        createElement('span', 'map-pin-bubble', [iconElement(place.icon, 'map-pin-icon')]),
        createElement('span', 'map-pin-label', [place.name]),
        createElement('span', 'map-pin-ring'),
      ]);
      element.type = 'button';
      element.setAttribute('aria-label', place.name);
      element.addEventListener('pointerenter', () => this.#select(place));
      element.addEventListener('focus', () => this.#select(place));
      element.addEventListener('click', () => this.#select(place));
      this.#pinsElement.append(element);
      const anchor = respawns.getByName(place.respawnName).position.clone().setY(PIN_LIFT);
      return { place, element, anchor };
    });
    this.#placesElement.replaceChildren(...ISLAND_PLACES.map((place) => this.#placeItem(place)));
  }

  #placeItem(place: IslandPlace): HTMLElement {
    const button = createElement('button', 'map-place', [iconElement(place.icon, 'map-place-icon'), place.name]);
    button.type = 'button';
    button.addEventListener('click', () => this.#select(place, { isPanning: true }));
    return createElement('li', '', [button]);
  }

  #select(place: IslandPlace, { isPanning = false }: { isPanning?: boolean } = {}): void {
    this.#selected = place;
    this.#card.icon.src = worldAsset(`ui/map/icons/${place.icon}.webp`);
    this.#card.title.textContent = place.name;
    this.#card.text.textContent = place.description;
    this.#card.root.classList.remove(HIDDEN_CLASS);
    for (const pin of this.#pins) pin.element.classList.toggle(SELECTED_CLASS, pin.place === place);
    if (!isPanning) return;
    const pin = this.#pins.find((item) => item.place === place);
    if (pin) this.#flyFocus(pin.anchor, FLIGHT.rise);
  }

  #rise(): void {
    const { view, world } = getGame();
    this.#ensurePins();
    this.#destination = null;
    this.#card.root.classList.add(HIDDEN_CLASS);
    world.grass?.setVisible(false);
    const frame = this.#frame();
    view.overview.radius = frame.radius;
    view.setOverviewWide(true);
    view.focusPoint.isTracking = false;
    view.focusPoint.magnet.active = false;
    this.#flyFocus(frame.center, FLIGHT.rise);
    gsap.to(view.overview, { amount: 1, duration: FLIGHT.rise, ease: FLIGHT.ease, overwrite: true });
  }

  #land(): void {
    const { view, world, player, physicalVehicle, respawns } = getGame();
    const destination = this.#destination;
    if (destination) {
      const respawn = respawns.getByName(destination.respawnName);
      physicalVehicle.moveTo(respawn.position, respawn.rotation);
    }
    this.#flyFocus(destination ? respawns.getByName(destination.respawnName).position : player.position, FLIGHT.land);
    gsap.to(view.overview, {
      amount: 0,
      duration: FLIGHT.land,
      ease: FLIGHT.ease,
      overwrite: true,
      onComplete: () => {
        view.setOverviewWide(false);
        world.grass?.setVisible(true);
        view.focusPoint.isTracking = true;
        view.focusPoint.magnet.active = true;
      },
    });
  }

  #frame(): OverviewFrame {
    const { view, viewport } = getGame();
    const isCompact = viewport.width <= COMPACT_SCREEN.width || viewport.height <= COMPACT_SCREEN.height;
    const insets = isCompact ? FRAME_INSETS.compact : FRAME_INSETS.wide;
    return view.frameOverview(
      this.#pins.map(({ anchor }) => anchor),
      insets,
    );
  }

  #reframe(): void {
    if (!this.#modal.isOpen || this.#destination) return;
    const frame = this.#frame();
    this.#flyFocus(frame.center, REFRAME_DURATION);
    gsap.to(getGame().view.overview, { radius: frame.radius, duration: REFRAME_DURATION, overwrite: 'auto' });
  }

  #flyFocus(target: THREE.Vector3, duration: number): void {
    gsap.to(getGame().view.focusPoint.position, {
      x: target.x,
      z: target.z,
      duration,
      ease: FLIGHT.ease,
      overwrite: true,
    });
  }

  #travelTo(place: IslandPlace): void {
    this.#destination = place;
    getGame().modals.close();
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

  #place(element: HTMLElement, world: THREE.Vector3): void {
    const { camera } = getGame().view;
    const { width, height } = getGame().viewport;
    this.#projected.copy(world).project(camera);
    const isVisible = this.#projected.z < 1 && Math.abs(this.#projected.x) < 1.1 && Math.abs(this.#projected.y) < 1.1;
    const x = (this.#projected.x * 0.5 + 0.5) * width;
    const y = (-this.#projected.y * 0.5 + 0.5) * height;
    const placement = isVisible ? `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)` : HIDDEN_CLASS;
    if (this.#placements.get(element) === placement) return;
    this.#placements.set(element, placement);
    element.classList.toggle(HIDDEN_CLASS, !isVisible);
    if (isVisible) element.style.transform = placement;
  }

  update(): void {
    if (!this.#modal.isOpen) return;
    for (const pin of this.#pins) this.#place(pin.element, pin.anchor);
    this.#place(this.#carElement, getGame().player.position);
  }
}
