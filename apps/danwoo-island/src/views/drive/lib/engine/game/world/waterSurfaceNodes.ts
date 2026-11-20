import { hash, positionWorld, texture, uniform } from 'three/tsl';
import type * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { RIPPLES, type Vec4Node } from '@views/drive/lib/engine/game/world/waterSurfaceConfig';

type RatioNode = THREE.UniformNode<'float', number>;

export function ripplesNode(terrainData: Vec4Node, ripplesRatio: RatioNode): THREE.Node<'float'> {
  const { wind, noises } = getGame();
  const slopeFrequency = uniform(RIPPLES.frequency);
  const noiseFrequency = uniform(0.1);
  const noiseOffset = uniform(0.345);
  const rippleIndex = terrainData.b.add(wind.localTime.mul(0.5)).mul(slopeFrequency).floor();
  const ripplesNoise = texture(noises.perlin, positionWorld.xz.add(rippleIndex.div(noiseOffset)).mul(noiseFrequency)).r;
  const ripples = terrainData.b
    .add(wind.localTime.mul(0.5))
    .mul(slopeFrequency)
    .mod(1)
    .sub(terrainData.b.remap(0, 1, -0.3, 1).oneMinus())
    .add(ripplesNoise);
  ripples.assign(ripplesRatio.remap(0, 1, -1, -0.4).step(ripples).mul(RIPPLES.opacity));
  return ripples;
}

export function iceNode(terrainData: Vec4Node, iceRatio: RatioNode): THREE.Node<'float'> {
  const iceVoronoi = texture(getGame().noises.voronoi, positionWorld.xz.mul(uniform(0.3))).g;
  const ice = terrainData.b.remapClamp(0, iceRatio, 0, 1).toVar();
  ice.assign(iceVoronoi.step(ice));
  return ice;
}

export function splashesNode(splashesRatio: RatioNode): THREE.Node<'float'> {
  const { noises, wind } = getGame();
  const noiseFrequency = uniform(0.33);
  const voronoi = texture(noises.voronoi, positionWorld.xz.mul(noiseFrequency));
  const perlin = texture(noises.perlin, positionWorld.xz.mul(noiseFrequency.mul(0.25))).r;
  const splash = voronoi.r;
  const splashTime = wind.localTime.mul(uniform(6)).add(hash(voronoi.b.mul(123456)).add(perlin));
  splash.assign(splash.sub(splashTime).mod(1));
  const edgeMultiplier = voronoi.g.remapClamp(uniform(0.14), uniform(1), 0, 1);
  splash.assign(splash.step(uniform(0.3).mul(edgeMultiplier)).oneMinus());
  const visible = hash(voronoi.b.mul(654321)).add(perlin).mod(1);
  visible.assign(splashesRatio.step(visible));
  splash.assign(splash.mul(visible));
  return splash;
}
