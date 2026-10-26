import { interactionDestination } from '@shared/world/interactions';
import type { WorldPortal } from '@shared/world/portals';
import { DESTINATIONS, canWalk, type Point, type Region } from '@shared/world/world';
import * as THREE from 'three';
import type { createPortals } from './portals';

export type PickTarget = { point: Point; portal: WorldPortal | null; interactive: boolean };

type PointerPickOptions = {
  canvas: HTMLCanvasElement;
  camera: THREE.Camera;
  portals: ReturnType<typeof createPortals>;
  markers: THREE.Sprite[];
};

/** Resolves a pointer to what it lands on: an exit, a landmark marker, or walkable ground. */
export function createPointerPick({ canvas, camera, portals, markers }: PointerPickOptions) {
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const intersection = new THREE.Vector3();
  return (event: PointerEvent, region: Region): PickTarget | null => {
    const bounds = canvas.getBoundingClientRect();
    ray.setFromCamera(
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
      ),
      camera,
    );
    const portal = portals.pick(ray, region);
    if (portal) return { point: portal.center, portal, interactive: true };
    const marker = ray.intersectObjects(markers.filter((item) => item.visible))[0];
    if (marker) {
      const point = DESTINATIONS[markers.indexOf(marker.object as THREE.Sprite)];
      if (point) return { point, portal: null, interactive: true };
    }
    if (!ray.ray.intersectPlane(groundPlane, intersection)) return null;
    const hit = { x: (intersection.x + 60) / 1.2, z: (40 - intersection.y) / 0.8 };
    const interactive = interactionDestination(hit, region);
    const point = interactive ?? hit;
    return canWalk(point.x, point.z, region) ? { point, portal: null, interactive: interactive !== null } : null;
  };
}
