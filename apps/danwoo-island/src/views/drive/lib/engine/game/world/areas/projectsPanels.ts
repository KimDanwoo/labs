import gsap from 'gsap';
import * as THREE from 'three/webgpu';

import type { Intersect } from '../../rayCursor';
import type { TextCanvas } from '../../textCanvas';
import { hoverArrow, sphereIntersect } from './showcaseSigns';
import {
  applyTextMaterial,
  childStartingWith,
  firstChild,
  type HoverMaterials,
  type Shades,
  showcaseTextCanvas,
} from './showcaseVisuals';

type Require = (name: string) => THREE.Object3D;

interface PageDot {
  readonly index: number;
  readonly mesh: THREE.Mesh;
  readonly reference: THREE.Object3D;
  readonly sphere: THREE.Sphere;
  readonly intersect: Intersect;
  isVisible: boolean;
}

interface AttributeItem {
  readonly group: THREE.Object3D;
  readonly canvas: TextCanvas;
}

interface AdjacentPanel {
  readonly inner: THREE.Object3D;
  readonly canvas: TextCanvas;
  readonly intersect: Intersect;
}

const PAGE_SPACING = 0.2;
const DOT_TWEEN = { duration: 0.5, ease: 'power1.inOut' } as const;
const DOT_HIDDEN_SCALE = 0.01;
const ATTRIBUTE_NAMES = ['role', 'at', 'with'] as const;
const ATTRIBUTE_SPACING = 0.75;
const ATTRIBUTE_CANVAS = { fontSize: 0.23, width: 1.4, height: 0.45, lineHeight: 0.2 } as const;
const ADJACENT_CANVAS = { fontSize: 0.3, width: 1.25, height: 0.75, lineHeight: 0.3 } as const;
const SWAP_DELAY = 1;

export type AttributeName = (typeof ATTRIBUTE_NAMES)[number];

export class ImagePagination {
  readonly #group: THREE.Object3D;
  readonly #dots: PageDot[] = [];
  readonly #arrows: readonly [Intersect, Intersect];

  constructor({
    require,
    dotReferences,
    hover,
    onSelect,
    onPrevious,
    onNext,
  }: {
    require: Require;
    dotReferences: readonly THREE.Object3D[];
    hover: HoverMaterials;
    onSelect: (index: number) => void;
    onPrevious: () => void;
    onNext: () => void;
  }) {
    this.#group = firstChild(require('pagination'));
    for (const child of this.#group.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      const index = this.#dots.length;
      const reference = dotReferences[index];
      if (!reference) throw new Error(`Pagination intersect is missing: ${index}`);
      child.position.x = PAGE_SPACING * index;
      child.visible = false;
      const sphere = new THREE.Sphere(new THREE.Vector3(), reference.scale.x);
      const intersect = hoverArrow({ arrow: child, shape: sphere, hover, onClick: () => onSelect(index) });
      reference.getWorldPosition(sphere.center);
      this.#dots.push({ index, mesh: child, reference, sphere, intersect, isVisible: false });
    }

    this.#arrows = [
      hoverArrow({
        arrow: require('arrowPreviousImage'),
        shape: sphereIntersect(require('intersectPreviousImage')),
        hover,
        onClick: onPrevious,
      }),
      hoverArrow({
        arrow: require('arrowNextImage'),
        shape: sphereIntersect(require('intersectNextImage')),
        hover,
        onClick: onNext,
      }),
    ];
  }

  setActive(isActive: boolean): void {
    for (const dot of this.#dots) dot.intersect.active = isActive && dot.isVisible;
    for (const arrow of this.#arrows) arrow.active = isActive;
  }

  update({ imageCount, imageIndex, isShown }: { imageCount: number; imageIndex: number; isShown: boolean }): void {
    for (const dot of this.#dots) {
      const shouldShow = dot.index <= imageCount - 1;
      if (shouldShow && !dot.isVisible) {
        gsap.to(dot.mesh.scale, { x: 1, y: 1, z: 1, ...DOT_TWEEN, overwrite: true });
        dot.mesh.visible = true;
        dot.isVisible = true;
        dot.intersect.active = isShown;
      } else if (!shouldShow && dot.isVisible) {
        gsap.to(dot.mesh.scale, {
          x: DOT_HIDDEN_SCALE,
          y: DOT_HIDDEN_SCALE,
          z: DOT_HIDDEN_SCALE,
          ...DOT_TWEEN,
          overwrite: true,
          onComplete: () => {
            dot.mesh.visible = false;
          },
        });
        dot.isVisible = false;
        dot.intersect.active = false;
      }
      dot.mesh.rotation.z = imageIndex === dot.index ? 0 : Math.PI;
    }

    gsap.to(this.#group.position, {
      x: (-(imageCount - 1) * PAGE_SPACING) / 2,
      ...DOT_TWEEN,
      overwrite: true,
      onComplete: () => {
        for (const dot of this.#dots) dot.reference.getWorldPosition(dot.sphere.center);
      },
    });
  }
}

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
