import {
  color,
  Fn,
  instancedArray,
  mix,
  positionGeometry,
  sin,
  smoothstep,
  texture,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { COLORS, DEBRIS, debrisData, DUST, FUNNEL } from './altarAreaConfig';
import type { Area } from './area';

export interface AltarEffectContext {
  area: Area;
  position: THREE.Vector3;
  swirlTime: THREE.UniformNode<'float', number>;
}

function addHideable(area: Area, mesh: THREE.Mesh): void {
  area.game.scene.add(mesh);
  area.objects.hideable.push(mesh);
}

export function createFunnel(context: AltarEffectContext, scale: number, direction: number): void {
  const { area, position, swirlTime } = context;
  const { noises } = area.game;
  const geometry = new THREE.CylinderGeometry(
    FUNNEL.topRadius * scale,
    FUNNEL.bottomRadius * scale,
    FUNNEL.height,
    FUNNEL.segments,
    FUNNEL.rows,
    true,
  );
  geometry.translate(0, FUNNEL.height / 2, 0);
  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, transparent: true, depthWrite: false });
  const time = swirlTime;
  material.positionNode = Fn(() => {
    const position = positionGeometry.toVar();
    const height = position.y.div(FUNNEL.height);
    position.x.addAssign(
      sin(time.mul(1.3).add(position.y.mul(0.45)))
        .mul(FUNNEL.sway)
        .mul(height),
    );
    position.z.addAssign(
      sin(time.mul(1.1).add(position.y.mul(0.35)).add(1.7))
        .mul(FUNNEL.sway)
        .mul(height),
    );
    return position;
  })();
  material.outputNode = Fn(() => {
    const baseUv = uv();
    const bandUv = vec2(
      baseUv.x
        .mul(3)
        .add(time.mul(0.6 * direction))
        .add(baseUv.y.mul(1.2)),
      baseUv.y.mul(2).sub(time.mul(0.25)),
    );
    const bands = texture(noises.perlin, bandUv).r;
    const edge = smoothstep(0, 0.12, baseUv.y).mul(smoothstep(1, 0.75, baseUv.y));
    const alpha = smoothstep(0.38, 0.72, bands).mul(edge).mul(0.85);
    alpha.lessThan(0.02).discard();
    return vec4(mix(color(COLORS.dust), color(COLORS.mist), bands), alpha);
  })();
  const funnel = new THREE.Mesh(geometry, material);
  funnel.position.copy(position);
  addHideable(area, funnel);
}

export function createDust(context: AltarEffectContext): void {
  const { area, position, swirlTime } = context;
  const { noises } = area.game;
  const time = swirlTime;
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  material.outputNode = Fn(() => {
    const centered = uv().sub(0.5);
    const radius = centered.length().mul(2);
    radius.greaterThan(1).discard();
    const angle = centered.y.atan(centered.x);
    const swirlUv = vec2(
      angle
        .div(Math.PI * 2)
        .add(radius.mul(0.8))
        .sub(time.mul(0.12)),
      radius.mul(2),
    );
    const swirl = texture(noises.perlin, swirlUv).r;
    const alpha = smoothstep(0.4, 0.7, swirl)
      .mul(smoothstep(1, 0.3, radius))
      .mul(0.7);
    return vec4(mix(color(COLORS.dust), color(COLORS.sand), swirl), alpha);
  })();
  const dust = new THREE.Mesh(new THREE.PlaneGeometry(DUST.radius * 2, DUST.radius * 2), material);
  dust.position.copy(position);
  dust.position.y += 0.03;
  dust.rotation.x = -Math.PI / 2;
  addHideable(area, dust);
}

export function createDebris(context: AltarEffectContext): void {
  const { area, position, swirlTime } = context;
  const { seeds, heights } = debrisData();
  const seed = instancedArray(seeds, 'float').toAttribute();
  const height = instancedArray(heights, 'float').toAttribute();
  const time = swirlTime;
  const material = new THREE.SpriteNodeMaterial();
  material.positionNode = Fn(() => {
    const radius = mix(FUNNEL.bottomRadius, FUNNEL.topRadius, height).mul(seed.mul(0.5).add(0.75));
    const angle = seed.mul(Math.PI * 2).add(time.mul(2.4).div(radius.add(0.4)));
    const rise = height
      .add(time.mul(0.05).mul(seed.add(0.5)))
      .fract()
      .mul(FUNNEL.height);
    return vec3(angle.cos().mul(radius), rise, angle.sin().mul(radius));
  })();
  material.outputNode = Fn(() => {
    const distanceToCenter = uv().sub(0.5).length();
    distanceToCenter.greaterThan(0.5).discard();
    return vec4(mix(color(COLORS.dust), color(COLORS.leaf), smoothstep(0.7, 0.75, seed)), 1);
  })();
  material.scaleNode = Fn(() => seed.mul(0.6).add(0.4))();
  const debris = new THREE.Mesh(new THREE.PlaneGeometry(DEBRIS.size, DEBRIS.size), material);
  debris.count = DEBRIS.count;
  debris.frustumCulled = false;
  debris.position.copy(position);
  addHideable(area, debris);
}
