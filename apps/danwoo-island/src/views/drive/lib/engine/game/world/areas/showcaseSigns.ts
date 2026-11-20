import gsap from 'gsap';
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import type { Intersect } from '@views/drive/lib/engine/game/rayCursor';
import {
  applyTextMaterial,
  childStartingWith,
  type Direction,
  firstChild,
  highlightTextMaterial,
  type HoverMaterials,
  type Shades,
  showcaseTextCanvas,
  TEXT_DENSITY,
} from '@views/drive/lib/engine/game/world/areas/showcaseVisuals';

const FLIP = { duration: 1, ease: 'power2.in', settleEase: 'back.out(2)' } as const;
const TITLE_CANVAS = { fontSize: 0.4, width: 4, height: 0.6 } as const;
const URL_CANVAS = { fontSize: 0.23, width: 4, height: 0.2 } as const;
const URL_FLIP_DELAY = 0.3;
const PANEL_PADDING = 0.2;
const PROTOCOL = /https?:\/\//;

class FlipSign {
  readonly #inner: THREE.Object3D;
  readonly #delay: number;
  #isHiding = false;

  constructor(inner: THREE.Object3D, delay: number) {
    this.#inner = inner;
    this.#delay = delay;
  }

  flip(direction: Direction, onTurned: () => void): void {
    if (this.#isHiding) return;
    this.#isHiding = true;
    const turn = direction === 'next' ? -1 : 1;
    const rotation = this.#inner.rotation;
    rotation.x = 0;
    gsap.to(rotation, {
      x: Math.PI * turn,
      duration: FLIP.duration,
      delay: this.#delay,
      ease: FLIP.ease,
      overwrite: true,
      onComplete: () => {
        this.#isHiding = false;
        gsap.to(rotation, {
          x: Math.PI * 2 * turn,
          duration: FLIP.duration,
          delay: 0,
          ease: FLIP.settleEase,
          overwrite: true,
        });
        onTurned();
      },
    });
  }
}

export class TitleSign {
  readonly #flip: FlipSign;
  readonly #canvas = showcaseTextCanvas(TITLE_CANVAS);
  readonly #getTitle: () => string;

  constructor(group: THREE.Object3D, shades: Shades, getTitle: () => string) {
    const inner = firstChild(group);
    this.#flip = new FlipSign(inner, 0);
    this.#getTitle = getTitle;
    applyTextMaterial(childStartingWith(inner, 'text'), this.#canvas.texture, shades);
  }

  update(direction: Direction): void {
    this.#flip.flip(direction, () => this.#canvas.updateText(this.#getTitle()));
  }
}

export class UrlSign {
  readonly highlight = uniform(0);
  readonly #flip: FlipSign;
  readonly #canvas = showcaseTextCanvas(URL_CANVAS);
  readonly #panel: THREE.Object3D;
  readonly #getUrl: () => string;

  constructor({ group, shades, getUrl }: { group: THREE.Object3D; shades: Shades; getUrl: () => string }) {
    const inner = firstChild(group);
    this.#flip = new FlipSign(inner, URL_FLIP_DELAY);
    this.#panel = childStartingWith(inner, 'panel');
    this.#getUrl = getUrl;

    const textMesh = childStartingWith(inner, 'text');
    textMesh.castShadow = false;
    textMesh.receiveShadow = false;
    if (textMesh instanceof THREE.Mesh) {
      textMesh.material = highlightTextMaterial(this.#canvas.texture, shades, this.highlight);
    }
  }

  update(direction: Direction): void {
    this.#flip.flip(direction, () => {
      this.#canvas.updateText(this.#getUrl().replace(PROTOCOL, ''));
      this.#panel.scale.x = this.#canvas.getMeasure().width / TEXT_DENSITY + PANEL_PADDING;
    });
  }

  open(): void {
    const url = this.#getUrl();
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function hideIntersectMesh(intersectMesh: THREE.Object3D): THREE.Mesh {
  if (!(intersectMesh instanceof THREE.Mesh)) throw new Error(`Intersect is not a mesh: ${intersectMesh.name}`);
  intersectMesh.visible = false;
  return intersectMesh;
}

export function urlSignIntersect(sign: UrlSign, intersectMesh: THREE.Object3D): Intersect {
  return getGame().rayCursor.addIntersect({
    active: false,
    shape: hideIntersectMesh(intersectMesh),
    onClick: () => sign.open(),
    onEnter: () => {
      sign.highlight.value = 1;
    },
    onLeave: () => {
      sign.highlight.value = 0;
    },
  });
}

export function sphereIntersect(reference: THREE.Object3D): THREE.Sphere {
  return new THREE.Sphere(reference.getWorldPosition(new THREE.Vector3()), reference.scale.x);
}

export function hoverArrow({
  arrow,
  shape,
  hover,
  onClick,
}: {
  arrow: THREE.Object3D;
  shape: THREE.Sphere;
  hover: HoverMaterials;
  onClick: () => void;
}): Intersect {
  const setMaterial = (material: THREE.Material): void => {
    if (arrow instanceof THREE.Mesh) arrow.material = material;
  };
  setMaterial(hover.inactive);
  return getGame().rayCursor.addIntersect({
    active: false,
    shape,
    onClick,
    onEnter: () => setMaterial(hover.active),
    onLeave: () => setMaterial(hover.inactive),
  });
}
