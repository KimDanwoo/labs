import {
  color,
  Fn,
  hash,
  instanceIndex,
  min,
  mix,
  positionLocal,
  select,
  sin,
  smoothstep,
  texture,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';

const SPOUTS = [
  new THREE.Vector3(-0.445, 1.03, 0.636),
  new THREE.Vector3(0, 1.03, 0.78),
  new THREE.Vector3(0.445, 1.03, 0.636),
] as const;
interface Surface {
  readonly radius: number;
  readonly surface: number;
  readonly tint: number;
  readonly isBowl: boolean;
}

const POOL = { radius: 1.0, surface: 0.35, landing: 0.95, tint: 0, isBowl: false } as const;
const BOWL = { radius: 0.6, surface: 1.02, tint: 0.7, isBowl: true } as const;
const STREAM = { radius: 0.07, segments: 20, sides: 8, bulge: 0.12, flow: 1.8 } as const;
const RIPPLE = { frequency: 4, speed: 0.9, width: 0.1 } as const;
const SPLASH = { count: 18, size: 0.06, rate: 1.5, reach: 0.18, height: 0.4 } as const;
const COLORS = { water: '#7fe0e4', foam: '#f4fbff' } as const;

function landingOf(spout: THREE.Vector3): THREE.Vector3 {
  const outward = spout.clone().setY(0).normalize();
  return outward.multiplyScalar(POOL.landing).setY(POOL.surface);
}

const IMPACTS = [landingOf(SPOUTS[0]), landingOf(SPOUTS[1]), landingOf(SPOUTS[2])] as const;

function streamCurve(spout: THREE.Vector3): THREE.QuadraticBezierCurve3 {
  const outward = spout.clone().setY(0).normalize();
  const control = spout.clone().addScaledVector(outward, STREAM.bulge);
  return new THREE.QuadraticBezierCurve3(spout, control, landingOf(spout));
}

function streamMaterial(): THREE.MeshBasicNodeMaterial {
  const { noises, ticker } = getGame();
  const time = ticker.elapsedScaledUniform;
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  material.outputNode = Fn(() => {
    const flow = texture(noises.perlin, vec2(uv().x.mul(2).sub(time.mul(STREAM.flow)), uv().y)).r;
    const foam = smoothstep(0.35, 0.7, flow);
    return vec4(mix(color(COLORS.water), color(COLORS.foam), foam), mix(0.55, 0.95, foam));
  })();
  return material;
}

function createStreams(): THREE.Group {
  const material = streamMaterial();
  const streams = new THREE.Group();
  for (const spout of SPOUTS) {
    const geometry = new THREE.TubeGeometry(streamCurve(spout), STREAM.segments, STREAM.radius, STREAM.sides);
    streams.add(new THREE.Mesh(geometry, material));
  }
  return streams;
}

function waterSurface({ radius, surface, tint, isBowl }: Surface): THREE.Mesh {
  const { noises, ticker } = getGame();
  const time = ticker.elapsedScaledUniform;
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  material.outputNode = Fn(() => {
    const impactDistance = min(
      positionLocal.xz.sub(vec2(IMPACTS[0].x, IMPACTS[0].z)).length(),
      min(
        positionLocal.xz.sub(vec2(IMPACTS[1].x, IMPACTS[1].z)).length(),
        positionLocal.xz.sub(vec2(IMPACTS[2].x, IMPACTS[2].z)).length(),
      ),
    );
    const distance = isBowl ? positionLocal.xz.length() : impactDistance;
    const ring = distance.mul(RIPPLE.frequency).sub(time.mul(RIPPLE.speed)).fract();
    const band = smoothstep(0, RIPPLE.width / 2, ring).mul(smoothstep(RIPPLE.width * 2, RIPPLE.width, ring));
    const fade = smoothstep(radius, 0.1, distance);
    const shimmer = smoothstep(0.7, 0.86, texture(noises.perlin, positionLocal.xz.mul(0.8).add(time.mul(0.05))).r);
    const foam = smoothstep(0.16, 0, impactDistance).mul(sin(time.mul(12)).mul(0.2).add(0.6));
    const highlight = band.mul(fade).mul(0.5).add(shimmer.mul(0.12)).add(foam).min(0.9);
    const base = color(COLORS.water);
    return vec4(mix(base, color(COLORS.foam), highlight), highlight.max(tint));
  })();
  const geometry = new THREE.CircleGeometry(radius, 48);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = surface;
  return mesh;
}

function createSplash(): THREE.Mesh {
  const time = getGame().ticker.elapsedScaledUniform;
  const seed = hash(instanceIndex);
  const phase = time.mul(SPLASH.rate).add(seed).fract();
  const spout = instanceIndex.mod(IMPACTS.length);
  const impact = select(
    spout.equal(0),
    vec3(...IMPACTS[0].toArray()),
    select(spout.equal(1), vec3(...IMPACTS[1].toArray()), vec3(...IMPACTS[2].toArray())),
  );
  const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false });
  material.positionNode = Fn(() => {
    const angle = seed.mul(Math.PI * 2);
    const reach = phase.mul(SPLASH.reach).add(0.03);
    const lift = phase.mul(phase.oneMinus()).mul(SPLASH.height).mul(seed.mul(0.6).add(0.7));
    return vec3(angle.cos().mul(reach), lift, angle.sin().mul(reach)).add(impact);
  })();
  material.outputNode = Fn(() => {
    uv().sub(0.5).length().greaterThan(0.5).discard();
    return vec4(color(COLORS.foam), phase.oneMinus());
  })();
  material.scaleNode = phase.oneMinus().mul(0.6).add(0.4);
  const splash = new THREE.Mesh(new THREE.PlaneGeometry(SPLASH.size, SPLASH.size), material);
  splash.count = SPLASH.count;
  splash.frustumCulled = false;
  return splash;
}

export function createFountainWater(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'fountainWater';
  group.add(createStreams(), waterSurface(POOL), waterSurface(BOWL), createSplash());
  return group;
}
