import { getWorldPortals, type WorldPortal } from '@shared/world/portals';
import { WORLDS, type Region } from '@shared/world/world';
import * as THREE from 'three';
import { canvasTexture } from './art';

/** Quiet direction signs; the road boundary, not the sign, triggers travel. */
export function createPortals(scene: THREE.Scene) {
  const entries = (Object.keys(WORLDS) as Region[]).flatMap((region) =>
    getWorldPortals(region).map((portal) => {
      const texture = canvasTexture(320, 76, (c) => {
        c.fillStyle = '#fff9e6ed';
        c.beginPath();
        c.roundRect(4, 4, 312, 68, 20);
        c.fill();
        c.strokeStyle = '#84aa8c';
        c.lineWidth = 2;
        c.stroke();
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = '#3d604b';
        c.font = 'bold 28px sans-serif';
        c.fillText(portal.label, 160, 38);
      });
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const label = new THREE.Sprite(material);
      label.position.set(
        THREE.MathUtils.clamp(portal.center.x * 1.2 - 60 + (portal.edge === 'bottom' ? 9 : 0), -49, 49),
        40 - portal.center.z * 0.8 + (portal.edge === 'bottom' ? 12 : 5),
        1,
      );
      label.scale.set(8, 1.9, 1);
      label.renderOrder = 2.3;
      label.visible = false;
      scene.add(label);
      return { region, portal, texture, material, label };
    }),
  );
  return {
    pick(ray: THREE.Raycaster, region: Region): WorldPortal | null {
      return (
        entries.find((entry) => entry.region === region && ray.intersectObject(entry.label, false).length)?.portal ??
        null
      );
    },
    update(region: Region) {
      entries.forEach((entry) => {
        entry.label.visible = entry.region === region;
      });
    },
    dispose() {
      entries.forEach(({ label, material, texture }) => {
        scene.remove(label);
        material.dispose();
        texture.dispose();
      });
    },
  };
}
