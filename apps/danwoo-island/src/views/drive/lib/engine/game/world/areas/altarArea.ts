import gsap from 'gsap';
import { color, Fn, instancedArray, mix, smoothstep, step, texture, uniform, uv, vec2, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import type { AudioItem } from '../../audio';
import { rebuildSurfPoint } from '../islandStructures';
import { Area } from './area';

const COLUMN = {
  radius: 2.5,
  height: 6,
  segments: 32,
  restLevel: 2.2,
  surgeDuration: 0.35,
  settleDuration: 2.4,
} as const;
const SPRAY = { count: 150, size: 0.22, maxRadius: 5, duration: 2.2 } as const;
const POOL = { radius: 2.5, triggerRadius: 2 } as const;
const LAUNCH = { upward: 9, forward: 4, cooldown: 1.5, maxHeight: 2.5 } as const;
const WATER = { deep: '#0f6f8c', sea: '#2fc6d4', foam: '#f4fbff', glow: 1.6 } as const;

function sprayData(): { positions: Float32Array; scales: Float32Array; randoms: Float32Array } {
  const positions = new Float32Array(SPRAY.count * 3);
  const scales = new Float32Array(SPRAY.count);
  const randoms = new Float32Array(SPRAY.count);
  for (let index = 0; index < SPRAY.count; index += 1) {
    const spherical = new THREE.Spherical(
      (1 - (1 - Math.random()) ** 2) * SPRAY.maxRadius,
      Math.random() * Math.PI * 0.4,
      Math.random() * Math.PI * 2,
    );
    new THREE.Vector3().setFromSpherical(spherical).toArray(positions, index * 3);
    scales[index] = Math.random();
    randoms[index] = Math.random();
  }
  return { positions, scales, randoms };
}

export class AltarArea extends Area {
  readonly #position: THREE.Vector3;
  readonly #sea = uniform(color(WATER.sea));
  readonly #deep = uniform(color(WATER.deep));
  readonly #foam = uniform(color(WATER.foam));
  readonly #glow = uniform(WATER.glow);
  readonly #columnLevel = uniform(COLUMN.restLevel);
  readonly #sprayProgress = uniform(0);
  readonly #swoosh: AudioItem;
  #lastLaunch = -Infinity;

  constructor(model: THREE.Object3D) {
    super(model);
    const pool = this.requireReference('altar');
    this.#position = pool.position.clone();
    const { audio } = this.game;
    audio.register({
      path: 'sounds/waves/lake-waves.mp3',
      autoplay: true,
      loop: true,
      volume: 0.25,
      positions: pool.position,
      distanceFade: 20,
    });
    this.#swoosh = audio.register({ path: 'sounds/swoosh/Swoosh 05.mp3', autoplay: false, loop: false, volume: 0.5 });
    this.#createColumn();
    this.#createPoolSurface();
    this.#createSpray();
    this.#createLaunchZone();
  }

  override setObjects(): void {
    rebuildSurfPoint(this.model);
    super.setObjects();
  }

  #addHideable(mesh: THREE.Mesh): void {
    this.game.scene.add(mesh);
    this.objects.hideable.push(mesh);
  }

  #createColumn(): void {
    const { ticker, noises } = this.game;
    const geometry = new THREE.CylinderGeometry(COLUMN.radius, COLUMN.radius, COLUMN.height, COLUMN.segments, 1, true);
    geometry.translate(0, COLUMN.height * 0.5, 0);
    const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, transparent: true });
    material.outputNode = Fn(() => {
      const baseUv = uv();
      const noiseUv = vec2(
        baseUv.x.mul(5).add(baseUv.y.mul(-1.5)),
        baseUv.y.mul(0.8).sub(ticker.elapsedScaledUniform.mul(0.35)),
      );
      const noise = texture(noises.perlin, noiseUv).r;
      const height = noise.add(baseUv.y.mul(this.#columnLevel.add(1)));
      height.greaterThan(1).discard();
      const foam = step(0.78, height);
      const water = mix(this.#deep, this.#sea, baseUv.y.oneMinus()).mul(this.#glow);
      return vec4(mix(water, this.#foam, foam), height.oneMinus().mul(2).clamp(0.35, 0.9));
    })();
    const column = new THREE.Mesh(geometry, material);
    column.position.copy(this.#position);
    this.#addHideable(column);
  }

  #createPoolSurface(): void {
    const { ticker, noises } = this.game;
    const material = new THREE.MeshBasicNodeMaterial();
    material.outputNode = Fn(() => {
      const centered = uv().sub(0.5);
      const radius = centered.length().mul(2);
      radius.greaterThan(1).discard();
      const angle = centered.y.atan(centered.x);
      const swirlUv = vec2(
        angle
          .div(Math.PI * 2)
          .add(radius.mul(0.6))
          .add(ticker.elapsedScaledUniform.mul(0.08)),
        radius.mul(1.5),
      );
      const ripple = texture(noises.perlin, swirlUv).r;
      const water = mix(this.#sea, this.#deep, radius.add(ripple.mul(0.35)).clamp(0, 1));
      const rim = smoothstep(0.82, 0.98, radius).add(step(0.62, ripple).mul(0.5)).clamp(0, 1);
      return vec4(mix(water, this.#foam, rim), 1);
    })();
    const surface = new THREE.Mesh(new THREE.PlaneGeometry(POOL.radius * 2, POOL.radius * 2, 1, 1), material);
    surface.position.copy(this.#position);
    surface.rotation.x = -Math.PI * 0.5;
    this.#addHideable(surface);
  }

  #createSpray(): void {
    const { positions, scales, randoms } = sprayData();
    const position = instancedArray(positions, 'vec3').toAttribute();
    const scale = instancedArray(scales, 'float').toAttribute();
    const random = instancedArray(randoms, 'float').toAttribute();
    const progress = this.#sprayProgress;

    const material = new THREE.SpriteNodeMaterial();
    material.outputNode = Fn(() => {
      const distanceToCenter = uv().sub(0.5).length();
      distanceToCenter.greaterThan(0.5).discard();
      return vec4(mix(this.#sea, this.#foam, step(distanceToCenter, 0.3)), 1);
    })();
    material.positionNode = Fn(() => {
      const spread = progress.remapClamp(0, 0.5, 1, 0).pow(6).oneMinus();
      const finalPosition = position.toVar();
      finalPosition.mulAssign(spread);
      finalPosition.y.addAssign(progress.mul(random).mul(2));
      return finalPosition;
    })();
    material.scaleNode = Fn(() => smoothstep(1, 0.3, progress).mul(scale))();

    const spray = new THREE.Mesh(new THREE.PlaneGeometry(SPRAY.size, SPRAY.size), material);
    spray.count = SPRAY.count;
    spray.position.copy(this.#position);
    this.#addHideable(spray);
  }

  #surge(): void {
    gsap.to(this.#columnLevel, {
      value: 0,
      ease: 'power2.out',
      duration: COLUMN.surgeDuration,
      onComplete: () => {
        gsap.to(this.#columnLevel, { value: COLUMN.restLevel, ease: 'power2.in', duration: COLUMN.settleDuration });
      },
    });
    gsap.fromTo(this.#sprayProgress, { value: 0 }, { value: 1, ease: 'linear', duration: SPRAY.duration });
  }

  #createLaunchZone(): void {
    const zone = this.game.zones.create('cylinder', this.#position.clone(), POOL.triggerRadius);
    zone.events.on('enter', () => {
      const now = this.game.ticker.elapsed;
      const isAirborne = this.game.player.position.y - this.#position.y > LAUNCH.maxHeight;
      if (isAirborne || now - this.#lastLaunch < LAUNCH.cooldown) return;
      this.#lastLaunch = now;
      this.game.physicalVehicle.launch({ upward: LAUNCH.upward, forward: LAUNCH.forward });
      this.#surge();
      this.#swoosh.play();
    });
  }
}
