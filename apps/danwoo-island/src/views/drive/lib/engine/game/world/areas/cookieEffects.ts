import { color, float, Fn, instancedArray, mix, step, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import type { Area } from './area';
import { EMBER_BOUNDS, emberData, EMBERS } from './cookieAreaConfig';

export function createEmbers(area: Area, localTime: THREE.UniformNode<'float', number>): void {
  const { positions, scales } = emberData();
  const positionAttribute = instancedArray(positions, 'vec3').toAttribute();
  const scaleAttribute = instancedArray(scales, 'float').toAttribute();
  const elevation = uniform(EMBERS.elevation);
  const material = new THREE.SpriteNodeMaterial();
  material.outputNode = area.game.materials.emissiveOutput('emissiveOrangeRadialGradient');

  const progress = float(0).toVar();
  material.positionNode = Fn(() => {
    const newPosition = positionAttribute.toVar();
    progress.assign(newPosition.y.add(localTime.mul(newPosition.y)).fract());
    newPosition.y.assign(progress.mul(elevation));
    newPosition.y.addAssign(step(EMBERS.hideAt, progress).mul(EMBERS.hideLift));
    return newPosition;
  })();
  material.scaleNode = Fn(() => scaleAttribute.mul(progress.remapClamp(0.5, 1, 1, 0)))();

  const mesh = new THREE.Mesh(new THREE.CircleGeometry(EMBERS.size, EMBERS.segments), material);
  mesh.position.copy(area.requireReference('chimney').position);
  mesh.count = EMBERS.count;
  area.game.scene.add(mesh);

  let needsBounds = true;
  area.events.on('frustumIn', () => {
    if (!needsBounds) return;
    needsBounds = false;
    area.game.ticker.wait(EMBER_BOUNDS.delayFrames, () => {
      const bounds = mesh.geometry.boundingSphere;
      if (!bounds) return;
      bounds.center.y = EMBER_BOUNDS.centerY;
      bounds.radius = EMBER_BOUNDS.radius;
    });
  });
  area.objects.hideable.push(mesh);
}

export function createOvenHeat(area: Area): THREE.Object3D {
  const { ticker, noises } = area.game;
  const material = new THREE.MeshBasicNodeMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  material.outputNode = Fn(() => {
    const noiseUv = uv().mul(vec2(2, 0.2));
    noiseUv.y.addAssign(ticker.elapsedScaledUniform.mul(0.05));
    const strength = texture(noises.perlin, noiseUv).r.mul(uv().y.pow(2));
    const emissiveColor = mix(color('#ff3e00'), color('#ff8641'), strength.smoothstep(0, 0.5)).mul(
      strength.add(1).mul(2),
    );
    return vec4(vec3(emissiveColor), strength);
  })();
  const ovenHeat = area.requireReference('ovenHeat');
  if (ovenHeat instanceof THREE.Mesh) ovenHeat.material = material;
  ovenHeat.castShadow = false;
  return ovenHeat;
}
