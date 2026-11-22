import { color, float, Fn, fwidth, mix, PI, positionGeometry, positionWorld, TWO_PI, uv, vec2, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';

type FloatNode = THREE.Node<'float'>;
type Vec2Node = THREE.Node<'vec2'>;
type ColorNode = THREE.Node<'vec3'> | THREE.Node<'color'>;

const SEA = {
  center: '#0B6A80',
  edge: '#071A2B',
  caustic: '#4FE3D6',
  sunrise: '#FFC46B',
  gradientStart: 2,
  gradientEnd: 42,
  patternScale: 1.7,
  drift: [0.11, -0.07],
  warpFrequency: [0.73, 0.91],
  warpSpeed: [0.17, -0.13],
  warpStrength: 0.9,
  crossFrequency: [1.17, 0.87],
  crossStrength: 0.65,
  lineWidth: 0.018,
  minimumAntialias: 0.012,
  antialiasScale: 1.5,
  haloWidth: 0.24,
  haloStrength: 0.07,
  causticIntensity: 0.38,
  edgeCausticStrength: 0.12,
  sunriseRadius: 5,
  sunriseIntensity: 0.1,
} as const;

const WAVE = {
  width: 7.5,
  height: 1.4,
  crests: 2.5,
  amplitude: 0.32,
  speed: 2.2,
  stroke: 0.06,
  endFade: 0.3,
  coral: '#FF7A59',
  gold: '#FFD27A',
  teal: '#4FE3D6',
  head: '#FFF4DC',
  trackIntensity: 0.55,
  trackOpacity: 0.16,
  activeIntensity: 3.2,
  activeOpacity: 0.96,
  minimumAntialias: 0.002,
  headLength: 0.35,
  headWidth: 0.25,
  headIntensity: 4,
  headFadeIn: 0.006,
} as const;

const FOAM = { color: '#F4FFFB', width: 0.35, minimumWidth: 0.001 } as const;

export const TIDE_REVEAL = { color: FOAM.color, intensity: 1.3 } as const;
export const TIDE_LABEL = '#F5FCFF';

function causticPattern(offset: Vec2Node, time: FloatNode): FloatNode {
  const point = offset
    .mul(SEA.patternScale)
    .add(time.mul(vec2(...SEA.drift)))
    .toVar();
  const warp = vec2(
    point.y.mul(SEA.warpFrequency[0]).add(time.mul(SEA.warpSpeed[0])).sin(),
    point.x.mul(SEA.warpFrequency[1]).add(time.mul(SEA.warpSpeed[1])).cos(),
  );
  const warped = point.add(warp.mul(SEA.warpStrength)).toVar();
  const first = warped.x.add(warped.y.mul(SEA.crossFrequency[0]).sin().mul(SEA.crossStrength)).sin().abs();
  const second = warped.y.add(warped.x.mul(SEA.crossFrequency[1]).cos().mul(SEA.crossStrength)).sin().abs();
  const distance = first.min(second).toVar();
  const antialias = fwidth(distance).max(SEA.minimumAntialias).mul(SEA.antialiasScale);
  const core = distance.smoothstep(SEA.lineWidth, antialias.add(SEA.lineWidth)).oneMinus();
  const halo = distance.smoothstep(SEA.lineWidth, SEA.haloWidth).oneMinus().mul(SEA.haloStrength);
  return core.add(halo);
}

function seaColor(offset: Vec2Node, time: FloatNode): ColorNode {
  const distance = offset.length().toVar();
  const depth = distance.smoothstep(SEA.gradientStart, SEA.gradientEnd).toVar();
  const base = mix(color(SEA.center), color(SEA.edge), depth);
  const causticFade = mix(float(1), float(SEA.edgeCausticStrength), depth);
  const caustics = color(SEA.caustic).mul(causticPattern(offset, time)).mul(causticFade).mul(SEA.causticIntensity);
  const glow = distance.div(SEA.sunriseRadius).pow(2).negate().exp();
  const sunrise = color(SEA.sunrise).mul(glow).mul(SEA.sunriseIntensity);
  return base.add(caustics).add(sunrise);
}

export function tideSeaMaterial(): THREE.MeshBasicNodeMaterial {
  const { reveal, ticker } = getGame();
  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide });
  material.outputNode = Fn(() => {
    const offset = positionWorld.xz.sub(reveal.position2Uniform).toVar();
    const tide = reveal.distanceFrom(positionWorld.xz).toVar();
    tide.lessThan(reveal.distance).discard();
    const foamWidth = reveal.distance.clamp(0, 1).mul(FOAM.width).max(FOAM.minimumWidth);
    const foam = tide.sub(reveal.distance).div(foamWidth).oneMinus().clamp(0, 1);
    return vec4(mix(seaColor(offset, ticker.elapsedUniform), color(FOAM.color), foam), 1);
  })();
  return material;
}

export function tideWaveGeometry(): THREE.PlaneGeometry {
  return new THREE.PlaneGeometry(WAVE.width, WAVE.height);
}

function waveGradient(along: FloatNode): ColorNode {
  const warm = mix(color(WAVE.coral), color(WAVE.gold), along.mul(2).clamp(0, 1));
  return mix(warm, color(WAVE.teal), along.sub(0.5).mul(2).clamp(0, 1));
}

export function tideWaveMaterial(progress: FloatNode, opacity: FloatNode): THREE.MeshBasicNodeMaterial {
  const { ticker } = getGame();
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide });
  material.outputNode = Fn(() => {
    const completion = progress.clamp(0, 1).toVar();
    const along = uv().x.toVar();
    const taper = along.mul(PI).sin().toVar();
    const crest = along
      .mul(TWO_PI)
      .mul(WAVE.crests)
      .sub(ticker.elapsedUniform.mul(WAVE.speed))
      .sin()
      .mul(WAVE.amplitude)
      .mul(taper);
    const gap = positionGeometry.y.sub(crest).toVar();
    const antialias = fwidth(gap).max(WAVE.minimumAntialias);
    const stroke = gap
      .abs()
      .smoothstep(WAVE.stroke, antialias.add(WAVE.stroke))
      .oneMinus()
      .mul(taper.smoothstep(0, WAVE.endFade));
    const filled = along.lessThan(completion).select(1, 0).toVar();
    const headAlong = along.sub(completion).mul(WAVE.width).div(WAVE.headLength);
    const headAcross = gap.div(WAVE.headWidth);
    const head = headAlong
      .mul(headAlong)
      .add(headAcross.mul(headAcross))
      .negate()
      .exp()
      .mul(completion.smoothstep(0, WAVE.headFadeIn))
      .toVar();
    const track = color(WAVE.teal).mul(WAVE.trackIntensity);
    const active = waveGradient(along).mul(WAVE.activeIntensity);
    const light = mix(track, active, filled).add(color(WAVE.head).mul(head).mul(WAVE.headIntensity));
    const alpha = mix(float(WAVE.trackOpacity), float(WAVE.activeOpacity), filled).mul(stroke).max(head);
    return vec4(light, alpha.mul(opacity));
  })();
  return material;
}
