import gsap from 'gsap';
import * as THREE from 'three/webgpu';

import { worldAsset } from '../../../config/worldAsset';
import { getGame } from './gameContext';
import { ISLAND_PLACES, type IslandPlace } from './islandPlaces';
import { FLIGHT, HIDDEN_CLASS, MAP_ACTION, type Pin, PIN_LIFT, REFRAME_DURATION, SELECTED_CLASS } from './mapConfig';
import { bindMapDrag, type MapDrag } from './mapDrag';
import { createPinElement, createPlaceButton } from './mapPins';
import { flyFocus, mapInsets, panWithin, placeOnScreen } from './mapView';
import type { ModalItem } from './modals';
import { TICK_ORDER } from './tickOrder';
import { createElement } from './utilities/createElement';
import { requireElement } from './utilities/requireElement';
import type { OverviewFrame } from './view/overviewFrame';

export class WorldMap {
  readonly #modal: ModalItem;
  readonly #pinsElement: HTMLElement;
  readonly #placesElement: HTMLElement;
  readonly #carElement: HTMLElement;
  readonly #card: { root: HTMLElement; icon: HTMLImageElement; title: HTMLElement; text: HTMLElement; go: HTMLElement };
  readonly #projected = new THREE.Vector3();
  readonly #placements = new WeakMap<HTMLElement, string>();
  readonly #chips = new Map<IslandPlace, HTMLElement>();
  #pins: Pin[] = [];
  #selected: IslandPlace | null = null;
  #destination: IslandPlace | null = null;
  #bounds: OverviewFrame | null = null;
  readonly #drag: MapDrag;

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
    this.#drag = this.#bindDrag();
    modal.events.on('open', () => this.#rise());
    modal.events.on('close', () => {
      this.#drag.cancel();
      this.#land();
    });
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER.map);
    game.viewport.events.on('change', () => this.#reframe());
  }

  #ensurePins(): void {
    if (this.#pins.length > 0) return;
    const { respawns } = getGame();
    this.#pins = ISLAND_PLACES.map((place) => {
      const element = createPinElement(place, () => this.#select(place));
      this.#pinsElement.append(element);
      const anchor = respawns.getByName(place.respawnName).position.clone().setY(PIN_LIFT);
      return { place, element, anchor };
    });
    this.#placesElement.replaceChildren(...ISLAND_PLACES.map((place) => this.#placeItem(place)));
  }

  #placeItem(place: IslandPlace): HTMLElement {
    const button = createPlaceButton(place, () => this.#select(place, { isPanning: true }));
    this.#chips.set(place, button);
    return createElement('li', '', [button]);
  }

  #select(place: IslandPlace, { isPanning = false }: { isPanning?: boolean } = {}): void {
    this.#selected = place;
    this.#card.icon.src = worldAsset(`ui/map/icons/${place.icon}.webp`);
    this.#card.title.textContent = place.name;
    this.#card.text.textContent = place.description;
    this.#card.root.classList.remove(HIDDEN_CLASS);
    for (const pin of this.#pins) pin.element.classList.toggle(SELECTED_CLASS, pin.place === place);
    for (const [chipPlace, chip] of this.#chips) chip.classList.toggle(SELECTED_CLASS, chipPlace === place);
    this.#chips.get(place)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    if (!isPanning) return;
    const pin = this.#pins.find((item) => item.place === place);
    if (pin) flyFocus(pin.anchor, FLIGHT.rise);
  }

  #rise(): void {
    const { view, world } = getGame();
    this.#ensurePins();
    this.#destination = null;
    this.#card.root.classList.add(HIDDEN_CLASS);
    world.grass?.setVisible(false);
    const frame = this.#frame();
    this.#bounds = frame;
    view.enterOverview(frame.radius);
    view.focusPoint.isTracking = false;
    view.focusPoint.magnet.active = false;
    flyFocus(frame.center, FLIGHT.rise);
    gsap.to(view.overview, { amount: 1, duration: FLIGHT.rise, ease: FLIGHT.ease, overwrite: true });
  }

  #land(): void {
    const { view, world, player, physicalVehicle, respawns } = getGame();
    const destination = this.#destination;
    if (destination) {
      const respawn = respawns.getByName(destination.respawnName);
      physicalVehicle.moveTo(respawn.position, respawn.rotation);
    }
    flyFocus(destination ? respawns.getByName(destination.respawnName).position : player.position, FLIGHT.land);
    gsap.to(view.overview, {
      amount: 0,
      duration: FLIGHT.land,
      ease: FLIGHT.ease,
      overwrite: true,
      onComplete: () => {
        view.leaveOverview();
        world.grass?.setVisible(true);
        view.focusPoint.isTracking = true;
        view.focusPoint.magnet.active = true;
      },
    });
  }

  #frame(): OverviewFrame {
    const { view, viewport } = getGame();
    return view.frameOverview(
      this.#pins.map(({ anchor }) => anchor),
      mapInsets(viewport.width, viewport.height),
    );
  }

  #reframe(): void {
    if (!this.#modal.isOpen || this.#destination) return;
    const frame = this.#frame();
    this.#bounds = frame;
    flyFocus(frame.center, REFRAME_DURATION);
    gsap.to(getGame().view.overview, {
      radius: frame.radius,
      duration: REFRAME_DURATION,
      ease: FLIGHT.ease,
      overwrite: 'auto',
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

  #bindDrag(): MapDrag {
    const { view, viewport } = getGame();
    return bindMapDrag(window, {
      isActive: () => this.#modal.isOpen && !this.#destination,
      camera: () => view.camera,
      viewport: () => viewport,
      focus: () => view.focusPoint.position,
      startPan: () => gsap.killTweensOf(view.focusPoint.position),
      panTo: (focus) => {
        if (this.#bounds) panWithin(this.#bounds, focus);
      },
    });
  }

  #placeAt(element: HTMLElement, world: THREE.Vector3): void {
    placeOnScreen(element, world, this.#projected, this.#placements);
  }

  update(): void {
    if (!this.#modal.isOpen) return;
    for (const pin of this.#pins) this.#placeAt(pin.element, pin.anchor);
    this.#placeAt(this.#carElement, getGame().player.position);
  }
}
