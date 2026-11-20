import gsap from 'gsap';
import * as THREE from 'three/webgpu';

import type { Intersect } from '@views/drive/lib/engine/game/rayCursor';
import type { TextCanvas } from '@views/drive/lib/engine/game/textCanvas';
import { hoverArrow, sphereIntersect } from '@views/drive/lib/engine/game/world/areas/showcaseSigns';
import {
  applyTextMaterial,
  childStartingWith,
  firstChild,
  type HoverMaterials,
  type Shades,
  showcaseTextCanvas,
} from '@views/drive/lib/engine/game/world/areas/showcaseVisuals';

export type Require = (name: string) => THREE.Object3D;

interface AdjacentPanel {
  readonly inner: THREE.Object3D;
  readonly canvas: TextCanvas;
  readonly intersect: Intersect;
}
const ADJACENT_CANVAS = { fontSize: 0.3, width: 1.25, height: 0.75, lineHeight: 0.3 } as const;
export const SWAP_DELAY = 1;

function adjacentPanel({
  group,
  arrow,
  intersectReference,
  shades,
  hover,
  onClick,
}: {
  group: THREE.Object3D;
  arrow: THREE.Object3D;
  intersectReference: THREE.Object3D;
  shades: Shades;
  hover: HoverMaterials;
  onClick: () => void;
}): AdjacentPanel {
  const inner = firstChild(group);
  const canvas = showcaseTextCanvas(ADJACENT_CANVAS);
  applyTextMaterial(childStartingWith(inner, 'text'), canvas.texture, shades);
  const intersect = hoverArrow({ arrow, shape: sphereIntersect(intersectReference), hover, onClick });
  return { inner, canvas, intersect };
}

export class ProjectAdjacents {
  readonly previous: AdjacentPanel;
  readonly next: AdjacentPanel;
  #isHiding = false;

  constructor({
    require,
    shades,
    hover,
    onPrevious,
    onNext,
  }: {
    require: Require;
    shades: Shades;
    hover: HoverMaterials;
    onPrevious: () => void;
    onNext: () => void;
  }) {
    this.previous = adjacentPanel({
      group: require('previous'),
      arrow: require('arrowPreviousProject'),
      intersectReference: require('intersectPreviousProject'),
      shades,
      hover,
      onClick: onPrevious,
    });
    this.next = adjacentPanel({
      group: require('next'),
      arrow: require('arrowNextProject'),
      intersectReference: require('intersectNextProject'),
      shades,
      hover,
      onClick: onNext,
    });
  }

  setActive(isActive: boolean): void {
    this.next.intersect.active = isActive;
    this.previous.intersect.active = isActive;
  }

  update(getTitles: () => { previous: readonly string[]; next: readonly string[] }): void {
    if (this.#isHiding) return;
    this.#isHiding = true;
    const { previous, next } = this;
    gsap.to(previous.inner.rotation, { z: Math.PI * 0.5, duration: 0.5, delay: 0, ease: 'power2.in', overwrite: true });
    gsap.to(next.inner.rotation, { z: -Math.PI * 0.5, duration: 0.5, delay: 0.2, ease: 'power2.in', overwrite: true });

    gsap.delayedCall(SWAP_DELAY, () => {
      this.#isHiding = false;
      gsap.to(previous.inner.rotation, { z: 0, duration: 1, delay: 0, ease: 'back.out(2)', overwrite: true });
      gsap.to(next.inner.rotation, { z: 0, duration: 1, delay: 0.4, ease: 'back.out(2)', overwrite: true });
      const titles = getTitles();
      previous.canvas.updateText(titles.previous);
      next.canvas.updateText(titles.next);
    });
  }
}
