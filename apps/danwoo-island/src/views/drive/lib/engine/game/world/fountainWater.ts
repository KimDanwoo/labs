import {
  color,
  Fn,
  hash,
  instanceIndex,
  mix,
  positionLocal,
  sin,
  smoothstep,
  texture,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';

const SHELL_MOUTH = new THREE.Vector3(-0.151, 0.665, 0.2);
const IMPACT = new THREE.Vector3(-0.116, 0.335, 0.54);
const POOL = { radius: 0.98, surface: 0.35 } as const;
const STREAM = { radius: 0.11, segments: 24, sides: 8, bulge: 0.18, flow: 1.6 } as const;
const RIPPLE = { frequency: 3.2, speed: 0.9, width: 0.12 } as const;
const SPLASH = { count: 12, size: 0.07, rate: 1.4, reach: 0.2, height: 0.5 } as const;
const COLORS = { water: '#7fe0e4', foam: '#f4fbff' } as const;

function streamCurve(): THREE.QuadraticBezierCurve3 {
  const outward = IMPACT.clone().sub(SHELL_MOUTH).setY(0).normalize();
  const control = SHELL_MOUTH.clone().addScaledVector(outward, STREAM.bulge);
  return new THREE.QuadraticBezierCurve3(SHELL_MOUTH, control, IMPACT.clone().setY(POOL.surface));
}

function createStream(): THREE.Mesh {
  const { noises, ticker } = getGame();
  const time = ticker.elapsedScaledUniform;
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  material.outputNode = Fn(() => {
    const flow = texture(noises.perlin, vec2(uv().x.mul(2).sub(time.mul(STREAM.flow)), uv().y)).r;
    const foam = smoothstep(0.35, 0.7, flow);
    return vec4(mix(color(COLORS.water), color(COLORS.foam), foam), mix(0.55, 0.95, foam));
  })();
  const geometry = new THREE.TubeGeometry(streamCurve(), STREAM.segments, STREAM.radius, STREAM.sides);
  return new THREE.Mesh(geometry, material);
}

function createRipples(): THREE.Mesh {
  const { noises, ticker } = getGame();
  const time = ticker.elapsedScaledUniform;
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  material.outputNode = Fn(() => {
    const distance = positionLocal.xz.sub(vec2(IMPACT.x, IMPACT.z)).length();
    const ring = distance.mul(RIPPLE.frequency).sub(time.mul(RIPPLE.speed)).fract();
    const band = smoothstep(0, RIPPLE.width / 2, ring).mul(smoothstep(RIPPLE.width * 2, RIPPLE.width, ring));
    const fade = smoothstep(POOL.radius, 0.15, distance);
    const shimmer = smoothstep(0.7, 0.86, texture(noises.perlin, positionLocal.xz.mul(0.8).add(time.mul(0.05))).r);
    const foam = smoothstep(0.2, 0, distance).mul(sin(time.mul(12)).mul(0.2).add(0.6));
    const alpha = band.mul(fade).mul(0.55).add(shimmer.mul(0.12)).add(foam);
    return vec4(color(COLORS.foam), alpha.min(0.9));
  })();
  const geometry = new THREE.CircleGeometry(POOL.radius, 48);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = POOL.surface;
  return mesh;
}

function createSplash(): THREE.Mesh {
  const time = getGame().ticker.elapsedScaledUniform;
  const seed = hash(instanceIndex);
  const phase = time.mul(SPLASH.rate).add(seed).fract();
  const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false });
  material.positionNode = Fn(() => {
    const angle = seed.mul(Math.PI * 2);
    const reach = phase.mul(SPLASH.reach).add(0.04);
    const lift = phase.mul(phase.oneMinus()).mul(SPLASH.height).mul(seed.mul(0.6).add(0.7));
    return vec3(angle.cos().mul(reach), lift, angle.sin().mul(reach)).add(vec3(IMPACT.x, POOL.surface, IMPACT.z));
  })();
  material.outputNode = Fn(() => {
    const edge = uv().sub(0.5).length();
    edge.greaterThan(0.5).discard();
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
  group.add(createStream(), createRipples(), createSplash());
  return group;
}
