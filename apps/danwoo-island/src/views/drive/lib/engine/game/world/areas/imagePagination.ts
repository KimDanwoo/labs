import type { Intersect } from '@views/drive/lib/engine/game/rayCursor';
import type { Require } from '@views/drive/lib/engine/game/world/areas/projectsPanels';
import { hoverArrow, sphereIntersect } from '@views/drive/lib/engine/game/world/areas/showcaseSigns';
import { firstChild, type HoverMaterials } from '@views/drive/lib/engine/game/world/areas/showcaseVisuals';
import gsap from 'gsap';
import * as THREE from 'three/webgpu';

interface PageDot {
  readonly index: number;
  readonly mesh: THREE.Mesh;
  readonly reference: THREE.Object3D;
  readonly sphere: THREE.Sphere;
  readonly intersect: Intersect;
  isVisible: boolean;
}

const PAGE_SPACING = 0.2;

const DOT_TWEEN = { duration: 0.5, ease: 'power1.inOut' } as const;

const DOT_HIDDEN_SCALE = 0.01;

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
