import * as THREE from 'three/webgpu';

import { requireElement } from '@views/drive/lib/engine/game/utilities/requireElement';
import { Area } from '@views/drive/lib/engine/game/world/areas/area';
import {
  frameCourseSigns,
  paintCourseSign,
  paintObstacleResetSign,
} from '@views/drive/lib/engine/game/world/areas/circuitSigns';

export interface MenuHandlers {
  isRacing: () => boolean;
  onRestart: () => void;
  onAbort: () => void;
}

export function bindMenu(area: Area, { isRacing, onRestart, onAbort }: MenuHandlers): HTMLElement {
  const { menu } = area.game;
  const item = menu.items.get('circuit');
  if (!item) throw new Error('Circuit menu is missing');
  const element = item.contentElement;
  requireElement(element, '.js-button-restart', HTMLElement).addEventListener('click', () => {
    onRestart();
    menu.close();
  });
  requireElement(element, '.js-button-end', HTMLElement).addEventListener('click', () => {
    if (isRacing()) onAbort();
    menu.close();
  });
  requireElement(element, '.js-button-controls', HTMLElement).addEventListener('click', () => menu.open('controls'));
  return requireElement(element, '.js-racing-buttons', HTMLElement);
}

export function createCourseSign(area: Area, checkpointCount: number, onReset: () => void): void {
  const reset = area.requireReference('leaderboardReset');
  const board = area.requireReference('leaderboard');
  paintCourseSign(board, area.objects.items, checkpointCount);
  paintObstacleResetSign(reset);
  frameCourseSigns(board, reset);
  const { interactiveButtons } = area.game.inputs;
  area.game.interactivePoints.create({
    position: reset.position.clone().add(new THREE.Vector3(0, 1, 0)),
    text: '장애물 다시 놓기',
    align: 'right',
    state: 'concealed',
    onInteract: () => onReset(),
    onReveal: () => interactiveButtons.addItems(['interact']),
    onConceal: () => interactiveButtons.removeItems(['interact']),
    onHide: () => interactiveButtons.removeItems(['interact']),
  });
}

export function bindEndModal(area: Area, onRestart: () => void): HTMLElement {
  const { modals } = area.game;
  const modal = modals.items.get('circuit-end');
  if (!modal) throw new Error('Circuit end modal is missing');
  requireElement(modal.element, '.js-button-restart', HTMLElement).addEventListener('click', () => {
    onRestart();
    modals.close();
  });
  return requireElement(modal.element, '.js-time', HTMLElement);
}

export function sharpenBrandTexture(area: Area): void {
  const map: unknown = Reflect.get(area.game.materials.get('circuitBrand'), 'map');
  if (!(map instanceof THREE.Texture)) return;
  map.minFilter = THREE.LinearFilter;
  map.magFilter = THREE.LinearFilter;
}
