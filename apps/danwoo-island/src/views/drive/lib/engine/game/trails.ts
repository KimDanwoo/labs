import {
  attribute,
  cross,
  dot,
  float,
  Fn,
  mat3,
  modelViewMatrix,
  positionGeometry,
  texture,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';

type Vec3Node = THREE.Node<'vec3'>;

export interface Trail {
  readonly position: THREE.Vector3;
  alpha: number;
  readonly lastPosition: THREE.Vector3;
  readonly data: Float32Array;
  readonly dataTexture: THREE.DataTexture;
  readonly mesh: THREE.Mesh;
}

const SUBDIVISIONS = 32;
const TEXEL = 1 / SUBDIVISIONS;
const DISTANCE_THROTTLE = 0.4;
const DECAY = 0.2;
const CHANNELS = 4;
const RADIUS = 0.1;
const RADIAL_SEGMENTS = 4;

const rotationBetween = Fn(([from, to]: [Vec3Node, Vec3Node]): THREE.Node<'mat3'> => {
  const cosTheta = dot(from, to);
  const axis = cross(from, to);
  const sinTheta = axis.length();
  axis.assign(axis.normalize());

  const c = cosTheta;
  const s = sinTheta;
  const t = c.oneMinus();
  return mat3(
    t.mul(axis.x).mul(axis.x).add(c),
    t.mul(axis.x).mul(axis.y).sub(s.mul(axis.z)),
    t.mul(axis.x).mul(axis.z).add(s.mul(axis.y)),
    t.mul(axis.x).mul(axis.y).add(s.mul(axis.z)),
    t.mul(axis.y).mul(axis.y).add(c),
    t.mul(axis.y).mul(axis.z).sub(s.mul(axis.x)),
    t.mul(axis.x).mul(axis.z).sub(s.mul(axis.y)),
    t.mul(axis.y).mul(axis.z).add(s.mul(axis.x)),
    t.mul(axis.z).mul(axis.z).add(c),
  );
});

function trailGeometry(): THREE.CylinderGeometry {
  const geometry = new THREE.CylinderGeometry(RADIUS, RADIUS, 1, RADIAL_SEGMENTS, SUBDIVISIONS, true);
  geometry.rotateY(Math.PI * 0.25);
  geometry.rotateX(-Math.PI * 0.5);
  geometry.translate(0, 0, 0.5);
  geometry.deleteAttribute('uv');
  return geometry;
}

export class Trails {
  readonly #items: Trail[] = [];
  readonly #geometry = trailGeometry();
  readonly #emissiveMultiplier = uniform(5);
  readonly #fresnelOffset = uniform(0.25);

  constructor() {
    getGame().ticker.events.on('tick', () => this.update(), TICK_ORDER.trails);
  }

  create(): Trail {
    const data = new Float32Array(SUBDIVISIONS * CHANNELS);
    const dataTexture = new THREE.DataTexture(data, SUBDIVISIONS, 1, THREE.RGBAFormat, THREE.FloatType);
    const mesh = new THREE.Mesh(this.#geometry, this.#material(dataTexture));
    mesh.renderOrder = 1;
    mesh.frustumCulled = false;
    getGame().scene.add(mesh);

    const trail: Trail = {
      position: new THREE.Vector3(),
      alpha: 0,
      lastPosition: new THREE.Vector3(Infinity, Infinity, Infinity),
      data,
      dataTexture,
      mesh,
    };
    this.#items.push(trail);
    return trail;
  }

  #material(dataTexture: THREE.DataTexture): THREE.MeshBasicNodeMaterial {
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
    const customNormal = vec3().toVarying();
    const ratio = float(0).toVarying();
    const alpha = float(0).toVarying();

    material.positionNode = Fn(() => {
      ratio.assign(positionGeometry.z.oneMinus());
      const trailData = texture(dataTexture, vec2(ratio, 0.5));
      const trailPosition = trailData.xyz;
      const nextPosition = texture(dataTexture, vec2(ratio.add(TEXEL), 0.5)).xyz;
      const rotation = rotationBetween(nextPosition.sub(trailPosition).normalize(), vec3(0, 0, -1));
      const rotatedPoint = rotation.mul(vec3(positionGeometry.x, positionGeometry.y, 0));
      customNormal.assign(modelViewMatrix.mul(vec4(rotation.mul(attribute('normal', 'vec3')), 0)));
      alpha.assign(trailData.w);
      return trailPosition.add(rotatedPoint);
    })();

    const gradient = getGame().materials.trailGradient;
    material.outputNode = Fn(() => {
      const fresnel = customNormal
        .dot(vec3(0, 0, 1))
        .abs()
        .oneMinus();
      const gradientUv = vec2(0.5, ratio.oneMinus().sub(fresnel.oneMinus().mul(this.#fresnelOffset)));
      const baseColor = texture(gradient, gradientUv).rgb.mul(this.#emissiveMultiplier);
      return vec4(vec3(baseColor), ratio.oneMinus().mul(alpha));
    })();
    return material;
  }

  update(): void {
    const decay = getGame().ticker.deltaScaled * DECAY;
    for (const trail of this.#items) {
      const { data, position } = trail;
      if (trail.lastPosition.distanceTo(position) > DISTANCE_THROTTLE) {
        data.copyWithin(CHANNELS, 0, (SUBDIVISIONS - 1) * CHANNELS);
        trail.lastPosition.copy(position);
      }
      for (let alphaIndex = CHANNELS - 1; alphaIndex < data.length; alphaIndex += CHANNELS) {
        data[alphaIndex] = Math.max((data[alphaIndex] ?? 0) - decay, 0);
      }
      data.set([position.x, position.y, position.z, trail.alpha], 0);
      trail.dataTexture.needsUpdate = true;
    }
  }
}
