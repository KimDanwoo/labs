import gsap from 'gsap';
import {
  attribute,
  cameraProjectionMatrix,
  cameraViewMatrix,
  color,
  floor,
  Fn,
  modelWorldMatrix,
  mul,
  positionGeometry,
  uniform,
  vec3,
  vec4,
  vertexIndex,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { WindLineGeometry } from '@views/drive/lib/engine/game/geometries/windLineGeometry';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import { remapClamp } from '@views/drive/lib/engine/game/utilities/maths';

const POOL_SIZE = 4;
const INTERVAL_MS = { min: 300, max: 2000 } as const;
const TRANSLATION = 1;
const THICKNESS = 0.1;
const ELEVATION = 2;
const DURATION_BY_WIND: [number, number] = [8, 2];

class WindLine {
  isAvailable = true;
  readonly mesh: THREE.Mesh;
  readonly progress = uniform(0);
  readonly #thickness = uniform(THICKNESS);

  constructor() {
    const material = new MeshDefaultMaterial({
      colorNode: color(0xffffff).rgb,
      normalNode: vec3(0, 1, 0),
      hasCoreShadows: false,
      hasDropShadows: false,
      hasLightBounce: false,
      hasFog: false,
      hasWater: false,
      transparent: true,
    });
    const tangentDirection = vec3(0, 1, -1);
    material.vertexNode = Fn(() => {
      const worldPosition = modelWorldMatrix.mul(vec4(positionGeometry, 1));
      const tangent = tangentDirection.normalize();
      const ratio = attribute('ratio', 'float');
      const baseThickness = ratio.sub(0.5).abs().mul(2).oneMinus().smoothstep(0, 1);
      const remappedProgress = this.progress.mul(3).sub(1);
      const progressThickness = ratio.sub(remappedProgress).abs().oneMinus().smoothstep(0, 1);
      const finalThickness = mul(this.#thickness, baseThickness, progressThickness);
      const sideStep = floor(vertexIndex.toFloat().mul(3).sub(2).div(3).mod(2)).sub(0.5);
      worldPosition.addAssign(vec4(tangent.mul(sideStep.mul(finalThickness)), 0));
      return cameraProjectionMatrix.mul(cameraViewMatrix.mul(worldPosition));
    })();

    this.mesh = new THREE.Mesh(new WindLineGeometry(), material);
    this.mesh.renderOrder = 1;
    this.mesh.position.y = ELEVATION;
    getGame().scene.add(this.mesh);
  }
}

export class WindLines {
  readonly #pool = Array.from({ length: POOL_SIZE }, () => new WindLine());

  constructor() {
    this.#scheduleNext();
  }

  #scheduleNext(): void {
    this.display();
    const delay = INTERVAL_MS.min + Math.random() * (INTERVAL_MS.max - INTERVAL_MS.min);
    setTimeout(() => this.#scheduleNext(), delay);
  }

  display(): void {
    const windLine = this.#pool.find(({ isAvailable }) => isAvailable);
    if (!windLine) return;

    const { weather, wind, view } = getGame();
    const duration = remapClamp(weather.wind.value, [0, 1], DURATION_BY_WIND);
    const { mesh } = windLine;
    mesh.visible = true;
    windLine.isAvailable = false;

    const { angle } = wind;
    mesh.position.x = view.focusPoint.position.x + (Math.random() - 0.5) * view.optimalArea.radius;
    mesh.position.z = view.focusPoint.position.z + (Math.random() - 0.5) * view.optimalArea.radius;
    mesh.rotation.y = angle;

    gsap.to(mesh.position, {
      x: mesh.position.x + Math.sin(angle) * TRANSLATION,
      z: mesh.position.z + Math.cos(angle) * TRANSLATION,
      duration,
    });
    gsap.fromTo(
      windLine.progress,
      { value: 0 },
      {
        value: 1,
        duration,
        onComplete: () => {
          mesh.visible = false;
          windLine.isAvailable = true;
        },
      },
    );
  }
}
