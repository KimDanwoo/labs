import gsap from 'gsap';
import { clamp } from 'three/src/math/MathUtils.js';
import { abs, atan, float, Fn, If, max, positionGeometry, step, uniform, vec2, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { Events } from '../events';
import { getGame } from '../gameContext';
import { smallestAngle } from '../utilities/maths';
import type { Pointer } from './pointer';

type PointerTrigger = 'start' | 'change' | 'end';

const RING = {
  edgesThickness: 0.1,
  outlineThickness: 0.2,
  radiusLow: 2,
  radiusHigh: 4.5,
  segments: 20,
} as const;
const FORWARD_AMPLITUDE = Math.PI * 1.5;
const HEIGHT = { offset: 0.25, min: 0.1, max: 0.65 } as const;
const ALPHA = { outline: 0.35, fill: 0.75 } as const;
const FULL_PROGRESS_BRIGHTNESS = 1.5;
const OUTLINE_EPSILON = 0.00001;
const JUMP = { height: 1, upSeconds: 0.1, downSeconds: 0.6 } as const;

const ringGeometry = (): THREE.RingGeometry => {
  const inner = RING.radiusLow - RING.edgesThickness - RING.outlineThickness;
  const outer = RING.radiusHigh + RING.edgesThickness + RING.outlineThickness;
  const geometry = new THREE.RingGeometry(inner, outer, RING.segments, 1);
  geometry.rotateX(-Math.PI * 0.5);
  return geometry;
};

export class Nipple {
  readonly game = getGame();
  readonly events = new Events<{ tap: [] }>();
  readonly forwardAmplitude = FORWARD_AMPLITUDE;
  readonly position = new THREE.Vector3();
  active = false;
  progress = 0;
  smallestAngle = 0;
  forward = true;
  #isAnimated = false;
  #angle = 0;
  #targetAngle = 0;
  #isInRadiusLow = false;
  readonly #raycaster = new THREE.Raycaster();
  readonly #uniforms = {
    progress: uniform(1),
    forward: uniform(1),
    progressStartAngle: uniform(0),
    progressEndAngle: uniform(0),
    colorMultiplier: uniform(1),
  };
  readonly #group = new THREE.Group();
  readonly #mesh = new THREE.Mesh(ringGeometry(), this.#material());

  constructor() {
    this.#group.visible = false;
    this.#group.add(this.#mesh);
    this.game.scene.add(this.#group);
  }

  setCoordinates(position: THREE.Vector3, angle: number): void {
    this.position.set(position.x, clamp(position.y - HEIGHT.offset, HEIGHT.min, HEIGHT.max), position.z);
    this.#group.position.copy(this.position);
    this.#angle = angle;
    this.#mesh.rotation.y = -angle;
  }

  updateFromPointer(pointer: Pointer, { trigger }: { trigger: PointerTrigger }): void {
    if (trigger === 'end') {
      this.#end();
      return;
    }
    if (trigger === 'start' && pointer.touches.length === 1) this.active = true;
    if (!this.active) return;
    if (pointer.touches.length !== 1) {
      this.active = false;
      return;
    }
    this.#aim(pointer);
    if (trigger === 'start' && this.progress === 0) this.#isInRadiusLow = true;
    if (trigger === 'change' && this.progress > 0) this.#isInRadiusLow = false;
  }

  jump(): void {
    this.#isAnimated = true;
    gsap.to(this.#mesh.position, {
      y: JUMP.height,
      duration: JUMP.upSeconds,
      ease: 'power2.out',
      overwrite: true,
      onComplete: () => {
        gsap.to(this.#mesh.position, {
          y: 0,
          duration: JUMP.downSeconds,
          ease: 'power4.inOut',
          overwrite: true,
          onComplete: () => {
            this.#isAnimated = false;
          },
        });
      },
    });
  }

  update(): void {
    this.#group.visible = this.active || this.#isAnimated;
    if (!this.#group.visible) return;

    this.smallestAngle = smallestAngle(this.#angle, this.#targetAngle);
    this.forward = Math.abs(this.smallestAngle) < FORWARD_AMPLITUDE / 2;
    if (!this.forward) this.smallestAngle = smallestAngle(this.#angle + Math.PI, this.#targetAngle);

    const [start, end] = this.#progressArc();
    this.#uniforms.forward.value = this.forward ? 1 : 0;
    this.#uniforms.progressStartAngle.value = start;
    this.#uniforms.progressEndAngle.value = end;
    this.#uniforms.colorMultiplier.value = this.progress === 1 ? FULL_PROGRESS_BRIGHTNESS : 1;
  }

  #end(): void {
    this.active = false;
    if (this.#isInRadiusLow) this.events.trigger('tap');
    this.#isInRadiusLow = false;
  }

  #aim(pointer: Pointer): void {
    const camera = this.game.view.defaultCamera;
    if (!camera) return;
    const { width, height } = this.game.viewport;
    const ndc = new THREE.Vector2((pointer.current.x / width) * 2 - 1, -((pointer.current.y / height) * 2 - 1));
    this.#raycaster.setFromCamera(ndc, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.position.y);
    const intersect = new THREE.Vector3();
    this.#raycaster.ray.intersectPlane(plane, intersect);

    this.#targetAngle = Math.atan2(intersect.z - this.position.z, intersect.x - this.position.x);
    const distance = this.position.distanceTo(intersect);
    this.progress = clamp((distance - RING.radiusLow) / (RING.radiusHigh - RING.radiusLow), 0, 1);
    this.#uniforms.progress.value = this.progress;
  }

  #progressArc(): [number, number] {
    if (this.forward) return [Math.min(0, this.smallestAngle), Math.max(0, this.smallestAngle)];
    if (this.smallestAngle > 0) return [-Math.PI, -Math.PI + this.smallestAngle];
    return [Math.PI + this.smallestAngle, Math.PI];
  }

  #material(): THREE.MeshBasicNodeMaterial {
    const uniforms = this.#uniforms;
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
    material.outputNode = Fn(() => {
      const radialCoord = vec2(positionGeometry.xz);
      const radius = radialCoord.length();
      const radialAngle = atan(radialCoord.y, radialCoord.x);

      const directionSDF = abs(radialAngle)
        .sub(FORWARD_AMPLITUDE * 0.5)
        .toVar();
      If(uniforms.forward.lessThan(0.5), () => {
        directionSDF.assign(directionSDF.negate());
      });
      const inDirection = step(directionSDF, 0);

      const innerSDF = abs(radius.sub(RING.radiusLow)).toVar();
      const outerSDF = abs(radius.sub(RING.radiusHigh)).toVar();
      const edgesFill = max(
        step(innerSDF, RING.edgesThickness / 2),
        step(outerSDF, RING.edgesThickness / 2).mul(inDirection),
      );
      const edgesOutline = max(step(innerSDF, RING.outlineThickness / 2), step(outerSDF, RING.outlineThickness / 2));

      const progressReach = uniforms.progress.mul(RING.radiusHigh - RING.radiusLow - RING.outlineThickness / 2);
      const progressSDF = max(
        radius.sub(RING.radiusLow).sub(progressReach),
        radius.sub(RING.radiusLow + RING.outlineThickness / 2).negate(),
      ).toVar();
      const inArc = float(0).toVar();
      If(
        radialAngle.greaterThan(uniforms.progressStartAngle).and(radialAngle.lessThan(uniforms.progressEndAngle)),
        () => {
          inArc.assign(1);
        },
      );
      const progressFill = step(progressSDF, 0).mul(inArc);
      const progressOutline = step(progressSDF, RING.outlineThickness / 4).mul(inDirection);

      const outline = max(edgesOutline, progressOutline);
      const fill = max(edgesFill, progressFill).toVar();
      outline.lessThan(OUTLINE_EPSILON).discard();

      const alpha = outline.mul(ALPHA.outline).add(fill.mul(ALPHA.fill));
      return vec4(vec3(fill).mul(uniforms.colorMultiplier), alpha);
    })();
    return material;
  }
}
