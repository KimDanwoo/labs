import * as THREE from 'three';
import { getWorldPortals, type WorldPortal } from '../model/world/portals';
import { WORLDS, type Region } from '../model/world/world';
import { CANVAS_FONT_FAMILY, canvasTexture } from './art';
import { sceneX, sceneY } from './perspective';

const SIGN_FONT = `bold 28px ${CANVAS_FONT_FAMILY}`;

function paintSign(c: CanvasRenderingContext2D, text: string) {
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
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
  c.font = SIGN_FONT;
  c.fillText(text, 160, 38);
}

/** Quiet direction signs; the road boundary, not the sign, triggers travel. */
export function createPortals(scene: THREE.Scene) {
  const entries = (Object.keys(WORLDS) as Region[]).flatMap((region) =>
    getWorldPortals(region).map((portal) => {
      const texture = canvasTexture(320, 76, (c) => paintSign(c, portal.label));
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const label = new THREE.Sprite(material);
      label.position.set(
        THREE.MathUtils.clamp(sceneX(portal.center.x) + (portal.edge === 'bottom' ? 9 : 0), -49, 49),
        sceneY(portal.center.z) + (portal.edge === 'bottom' ? 12 : 5),
        1,
      );
      label.scale.set(8, 1.9, 1);
      label.renderOrder = 2.3;
      label.visible = false;
      scene.add(label);
      return { region, portal, texture, material, label };
    }),
  );
  // 처음 그릴 때 마루부리 조각이 아직 없으면 대체 서체로 그려지므로, 글리프를 받은 뒤 다시 그린다
  void document.fonts.load(SIGN_FONT, entries.map(({ portal }) => portal.label).join('')).then(() => {
    for (const { portal, texture } of entries) {
      const { image } = texture;
      const ctx = image instanceof HTMLCanvasElement ? image.getContext('2d') : null;
      if (!ctx) continue;
      paintSign(ctx, portal.label);
      texture.needsUpdate = true;
    }
  });
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
