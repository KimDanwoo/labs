import { worldAsset } from '@views/drive/config/worldAsset';
import type { IslandPlace, PlaceIcon } from '@views/drive/lib/engine/game/islandPlaces';
import { createElement } from '@views/drive/lib/engine/game/utilities/createElement';

function iconElement(icon: PlaceIcon, className: string): HTMLImageElement {
  const image = createElement('img', className);
  image.src = worldAsset(`ui/map/icons/${icon}.webp`);
  image.alt = '';
  return image;
}

export function createPinElement(place: IslandPlace, onSelect: () => void): HTMLElement {
  const element = createElement('button', 'map-pin', [
    createElement('span', 'map-pin-bubble', [iconElement(place.icon, 'map-pin-icon')]),
    createElement('span', 'map-pin-label', [place.name]),
    createElement('span', 'map-pin-ring'),
  ]);
  element.type = 'button';
  element.dataset.labelSide = place.labelSide ?? '';
  element.setAttribute('aria-label', place.name);
  element.addEventListener('pointerenter', onSelect);
  element.addEventListener('focus', onSelect);
  element.addEventListener('click', onSelect);
  return element;
}

export function createPlaceButton(place: IslandPlace, onSelect: () => void): HTMLElement {
  const button = createElement('button', 'map-place', [iconElement(place.icon, 'map-place-icon'), place.name]);
  button.type = 'button';
  button.addEventListener('click', onSelect);
  return button;
}
