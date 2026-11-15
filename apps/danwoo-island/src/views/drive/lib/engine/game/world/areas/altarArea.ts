import gsap from 'gsap';
import {
  color,
  float,
  Fn,
  instancedArray,
  instanceIndex,
  min,
  mix,
  smoothstep,
  step,
  texture,
  uniform,
  uv,
  varying,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import type { AudioItem } from '../../audio';
import { rebuildSeonangdang } from '../islandStructures';
import { Area } from './area';

const BEAM = { radius: 2.5, height: 6, segments: 32, attenuation: 2 } as const;
const PARTICLES = { count: 150, size: 0.2, maxRadius: 5, duration: 3 } as const;
const GLYPHS = { count: 40, columns: 32, maxElevation: 5, maxRadius: 8, scale: 0.2, renderOrder: 3 } as const;
const DEATH_ZONE = { depth: 1.25, radius: 2.5, secondBellDelay: 2.2 } as const;
const STAR_SCALE = 1.7;
const GLOW_BOUNDS = { centerY: 2, radius: 5, delayFrames: 2 } as const;

function particleData(): { positions: Float32Array; scales: Float32Array; randoms: Float32Array } {
  const positions = new Float32Array(PARTICLES.count * 3);
  const scales = new Float32Array(PARTICLES.count);
  const randoms = new Float32Array(PARTICLES.count);
  for (let index = 0; index < PARTICLES.count; index += 1) {
    const spherical = new THREE.Spherical(
      (1 - (1 - Math.random()) ** 2) * PARTICLES.maxRadius,
      Math.random() * Math.PI * 0.4,
      Math.random() * Math.PI * 2,
    );
    new THREE.Vector3().setFromSpherical(spherical).toArray(positions, index * 3);
    scales[index] = Math.random();
    randoms[index] = Math.random();
  }
  return { positions, scales, randoms };
}

function glyphData(): { positions: Float32Array; speeds: Float32Array } {
  const positions = new Float32Array(GLYPHS.count * 3);
  const speeds = new Float32Array(GLYPHS.count);
  for (let index = 0; index < GLYPHS.count; index += 1) {
    const angle = Math.PI * 2 * Math.random();
    const elevation = Math.random() * GLYPHS.maxElevation;
    const radius = Math.random() * GLYPHS.maxRadius;
    positions.set([Math.sin(angle) * radius, elevation, Math.cos(angle) * radius], index * 3);
    speeds[index] = 0.2 + Math.random() * 0.8;
  }
  return { positions, speeds };
}

export class AltarArea extends Area {
  readonly #position: THREE.Vector3;
  readonly #color = uniform(color('#ffb347'));
  readonly #emissive = uniform(8);
  readonly #glyphProgress = uniform(0);
  readonly #beamAttenuation = uniform(BEAM.attenuation);
  readonly #particleProgress = uniform(0);
  readonly #bells: { first: AudioItem; second: AudioItem };

  constructor(model: THREE.Object3D) {
    super(model);
    const altar = this.requireReference('altar');
    this.#position = altar.position.clone();
    const { audio } = this.game;
    audio.register({
      path: 'sounds/magic/Ghostly Whisper Background Loop 9.mp3',
      autoplay: true,
      loop: true,
      volume: 0.15,
      positions: altar.position,
      distanceFade: 20,
    });
    this.#bells = {
      first: audio.register({ path: 'sounds/bell/Death Hit.mp3', autoplay: false, loop: false, volume: 0.4 }),
      second: audio.register({
        path: 'sounds/bell/Epic Bell Impact Hit.mp3',
        autoplay: false,
        loop: false,
        volume: 0.4,
      }),
    };
    this.#createBeam();
    this.#createBeamParticles();
    this.#createGlyphs();
    this.#createDeathZone();
  }

  override setObjects(): void {
    rebuildSeonangdang(this.model, this.game.materials);
    super.setObjects();
  }

  #gooColor(): THREE.Node<'vec3'> {
    const { fog } = this.game;
    return fog.strength.mix(vec3(0), fog.color);
  }

  #addHideable(mesh: THREE.Mesh): void {
    this.game.scene.add(mesh);
    this.objects.hideable.push(mesh);
  }

  #createBeam(): void {
    const { ticker, noises } = this.game;
    const cylinderGeometry = new THREE.CylinderGeometry(BEAM.radius, BEAM.radius, BEAM.height, BEAM.segments, 1, true);
    cylinderGeometry.translate(0, BEAM.height * 0.5, 0);
    const cylinderMaterial = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide });
    cylinderMaterial.outputNode = Fn(() => {
      const baseUv = uv();
      const noiseUv = vec2(
        baseUv.x.mul(6).add(baseUv.y.mul(-2)),
        baseUv.y.mul(1).sub(ticker.elapsedScaledUniform.mul(0.2)),
      );
      const noise = texture(noises.perlin, noiseUv).r;
      noise.addAssign(baseUv.y.mul(this.#beamAttenuation.add(1)));
      const finalColor = mix(this.#color.mul(this.#emissive), this.#gooColor(), step(0.65, noise));
      noise.greaterThan(1).discard();
      return vec4(finalColor, 1);
    })();
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.copy(this.#position);
    this.#addHideable(cylinder);

    const star = this.game.texture('satanStarTexture');
    star.minFilter = THREE.NearestFilter;
    star.magFilter = THREE.NearestFilter;
    star.generateMipmaps = false;
    const bottomMaterial = new THREE.MeshBasicNodeMaterial({ transparent: true });
    bottomMaterial.outputNode = Fn(() => {
      const starUv = uv().sub(0.5).mul(STAR_SCALE).add(0.5);
      starUv.y.assign(starUv.y.oneMinus());
      const starMask = texture(star, starUv).r;
      return vec4(mix(this.#gooColor(), this.#color.mul(this.#emissive), starMask), 1);
    })();
    const bottom = new THREE.Mesh(new THREE.PlaneGeometry(BEAM.radius * 2, BEAM.radius * 2, 1, 1), bottomMaterial);
    bottom.position.copy(this.#position);
    bottom.rotation.x = -Math.PI * 0.5;
    this.#addHideable(bottom);
  }

  #animateBeam(): void {
    gsap.to(this.#beamAttenuation, {
      value: 0,
      ease: 'power2.out',
      duration: 0.4,
      onComplete: () => {
        gsap.to(this.#beamAttenuation, { value: BEAM.attenuation, ease: 'power2.in', duration: 3 });
      },
    });
  }

  #createBeamParticles(): void {
    const { positions, scales, randoms } = particleData();
    const position = instancedArray(positions, 'vec3').toAttribute();
    const scale = instancedArray(scales, 'float').toAttribute();
    const random = instancedArray(randoms, 'float').toAttribute();
    const progress = this.#particleProgress;

    const material = new THREE.SpriteNodeMaterial();
    material.outputNode = Fn(() => {
      const distanceToCenter = uv().sub(0.5).length();
      const finalColor = mix(this.#gooColor(), this.#color.mul(this.#emissive), step(distanceToCenter, 0.35));
      distanceToCenter.greaterThan(0.5).discard();
      return vec4(finalColor, 1);
    })();
    material.positionNode = Fn(() => {
      const localProgress = progress.remapClamp(0, 0.5, 1, 0).pow(6).oneMinus();
      const finalPosition = position.toVar();
      finalPosition.mulAssign(localProgress);
      finalPosition.y.addAssign(progress.mul(random));
      return finalPosition;
    })();
    material.scaleNode = Fn(() => smoothstep(1, 0.3, progress).mul(scale))();

    const particles = new THREE.Mesh(new THREE.PlaneGeometry(PARTICLES.size, PARTICLES.size), material);
    particles.count = PARTICLES.count;
    particles.position.copy(this.#position);
    particles.position.y -= 0.1;
    this.#addHideable(particles);
  }

  #createGlyphs(): void {
    const { ticker, materials } = this.game;
    const { positions, speeds } = glyphData();
    const positionAttribute = instancedArray(positions, 'vec3').toAttribute();
    const speedAttribute = instancedArray(speeds, 'float').toAttribute();
    const glyphs = this.game.texture('achievementsGlyphsTexture');
    const blueGlow = materials.emissiveOutput('emissiveBlueRadialGradient');
    const orangeGlow = materials.emissiveOutput('emissiveOrangeRadialGradient');

    const material = new THREE.SpriteNodeMaterial({ transparent: true });
    const progress = varying(float(0));
    material.positionNode = Fn(() => {
      progress.assign(ticker.elapsedScaledUniform.mul(0.05).add(float(instanceIndex).div(GLYPHS.count)).fract());
      const newPosition = positionAttribute.toVar();
      newPosition.y.addAssign(progress.mul(speedAttribute));
      return newPosition;
    })();
    material.scaleNode = Fn(() =>
      min(progress.remapClamp(0, 0.1, 0, 1), progress.remapClamp(0.7, 0.8, 1, 0), 1).mul(GLYPHS.scale),
    )();
    material.outputNode = Fn(() => {
      const glyphUv = uv().toVar();
      glyphUv.x.addAssign(instanceIndex);
      glyphUv.x.divAssign(GLYPHS.columns);
      texture(glyphs, glyphUv).r.lessThan(0.5).discard();
      return mix(orangeGlow, blueGlow, float(instanceIndex).div(GLYPHS.count).step(this.#glyphProgress));
    })();

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    mesh.renderOrder = GLYPHS.renderOrder;
    mesh.position.set(this.#position.x, 0, this.#position.z);
    mesh.count = GLYPHS.count;
    this.#addHideable(mesh);

    let needsBounds = true;
    this.events.on('frustumIn', () => {
      if (!needsBounds) return;
      needsBounds = false;
      this.game.ticker.wait(GLOW_BOUNDS.delayFrames, () => {
        const bounds = mesh.geometry.boundingSphere;
        if (!bounds) return;
        bounds.center.y = GLOW_BOUNDS.centerY;
        bounds.radius = GLOW_BOUNDS.radius;
      });
    });
  }

  #createDeathZone(): void {
    const position = this.#position.clone();
    position.y -= DEATH_ZONE.depth;
    const zone = this.game.zones.create('sphere', position, DEATH_ZONE.radius);
    zone.events.on('enter', () => {
      this.#animateBeam();
      gsap.fromTo(this.#particleProgress, { value: 0 }, { value: 1, ease: 'linear', duration: PARTICLES.duration });
      this.game.player.die();
      this.#bells.second.play();
      gsap.delayedCall(DEATH_ZONE.secondBellDelay, () => this.#bells.first.play());
    });
  }
}
