import type { TextCanvas } from '@views/drive/lib/engine/game/textCanvas';
import { SWAP_DELAY } from '@views/drive/lib/engine/game/world/areas/projectsPanels';
import {
  applyTextMaterial,
  childStartingWith,
  type Shades,
  showcaseTextCanvas,
} from '@views/drive/lib/engine/game/world/areas/showcaseVisuals';
import gsap from 'gsap';
import * as THREE from 'three/webgpu';

interface AttributeItem {
  readonly group: THREE.Object3D;
  readonly canvas: TextCanvas;
}

const ATTRIBUTE_NAMES = ['role', 'at', 'with'] as const;

const ATTRIBUTE_SPACING = 0.75;

const ATTRIBUTE_CANVAS = { fontSize: 0.23, width: 1.4, height: 0.45, lineHeight: 0.2 } as const;

export type AttributeName = (typeof ATTRIBUTE_NAMES)[number];

export class ProjectAttributes {
  readonly #group: THREE.Object3D;
  readonly #originalY: number;
  readonly #items = new Map<string, AttributeItem>();
  #isHiding = false;

  constructor(group: THREE.Object3D, shades: Shades) {
    this.#group = group;
    this.#originalY = group.position.y;
    for (const child of group.children) {
      child.visible = false;
      const canvas = showcaseTextCanvas(ATTRIBUTE_CANVAS);
      applyTextMaterial(childStartingWith(child, 'text'), canvas.texture, shades);
      this.#items.set(child.name, { group: child, canvas });
    }
  }

  update(getAttributes: () => Partial<Record<AttributeName, string>>): void {
    if (this.#isHiding) return;
    this.#isHiding = true;
    for (const [order, name] of ATTRIBUTE_NAMES.entries()) {
      const item = this.#items.get(name);
      if (!item) continue;
      const hidden = { x: 0.01, y: 0.01, z: 0.01 };
      gsap.to(item.group.scale, { ...hidden, duration: 0.5, delay: 0.1 * order, ease: 'power2.in', overwrite: true });
    }

    gsap.delayedCall(SWAP_DELAY, () => {
      this.#isHiding = false;
      const attributes = getAttributes();
      let shown = 0;
      for (const name of ATTRIBUTE_NAMES) {
        const item = this.#items.get(name);
        const attribute = attributes[name];
        if (!item || !attribute) continue;
        item.group.visible = true;
        gsap.to(item.group.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 1,
          delay: 0.2 * shown,
          ease: 'back.out(2)',
          overwrite: true,
        });
        item.canvas.updateText(attribute);
        item.group.position.y = -shown * ATTRIBUTE_SPACING;
        shown += 1;
      }
      this.#group.position.y = this.#originalY + ((shown - 1) * ATTRIBUTE_SPACING) / 2;
    });
  }
}
