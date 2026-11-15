import gsap from 'gsap';
import {
  color,
  Fn,
  instancedArray,
  mix,
  positionGeometry,
  sin,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { worldAsset } from '../../../../../config/worldAsset';
import type { AudioItem } from '../../audio';
import { ISLAND_PLACES, type IslandPlace } from '../../islandPlaces';
import { Player } from '../../player';
import { createElement } from '../../utilities/createElement';
import { rebuildSurfPoint } from '../islandStructures';
import { Area } from './area';
import { pickTornadoDestination } from './tornadoRoute';

const FUNNEL = { height: 9, bottomRadius: 0.7, topRadius: 3.4, segments: 48, rows: 24, sway: 0.35 } as const;
const DEBRIS = { count: 140, size: 0.18 } as const;
const DUST = { radius: 3 } as const;
const SPIN = { idle: 1, surge: 3.2, surgeIn: 0.4, surgeOut: 2.2 } as const;
const TRIGGER = { radius: 2, maxHeight: 2.5, cooldown: 2 } as const;
const LIFT = { upward: 11, spin: 9, carry: 0, duration: 1.6, updraft: 14 } as const;
const VISIT = { radius: 10, interval: 0.5 } as const;
const COLORS = { sand: '#e9d7ae', dust: '#c9b28a', mist: '#f7f3ea', leaf: '#7cbf5a' } as const;
const ORIGIN = 'altar';
const NOTICE_DURATION = 3;

function debrisData(): { seeds: Float32Array; heights: Float32Array } {
  const seeds = new Float32Array(DEBRIS.count);
  const heights = new Float32Array(DEBRIS.count);
  for (let index = 0; index < DEBRIS.count; index += 1) {
    seeds[index] = Math.random();
    heights[index] = Math.random();
  }
  return { seeds, heights };
}

function arrivalNotice({ name, icon }: IslandPlace): HTMLElement {
  const image = createElement('img', 'arrival-icon');
  image.src = worldAsset(`ui/map/icons/${icon}.webp`);
  image.alt = '';
  return createElement('div', 'top', [
    image,
    createElement('div', 'arrival-text', [
      createElement('span', 'arrival-label', ['회오리를 타고 도착했어요']),
      createElement('strong', 'arrival-name', [name]),
    ]),
  ]);
}

export class AltarArea extends Area {
  readonly #position: THREE.Vector3;
  readonly #spin = uniform(SPIN.idle);
  readonly #swirlTime = uniform(0);
  readonly #lift: AudioItem;
  readonly #visited = new Set<string>();
  #lastTrigger = -Infinity;
  #travelSequence: number | null = null;
  #liftCall: gsap.core.Tween | null = null;
  #visitTimer = 0;

  constructor(model: THREE.Object3D) {
    super(model);
    this.#position = this.requireReference('altar').position.clone();
    const { audio } = this.game;
    audio.register({
      path: 'sounds/wind/13582-wind-in-forest-loop.mp3',
      autoplay: true,
      loop: true,
      volume: 0.35,
      positions: this.#position,
      distanceFade: 22,
    });
    this.#lift = audio.register({ path: 'sounds/swoosh/Swoosh 02.mp3', autoplay: false, loop: false, volume: 0.6 });
    this.#createFunnel(1, 1);
    this.#createFunnel(0.72, -1.4);
    this.#createDust();
    this.#createDebris();
    this.#createTrigger();
    this.game.ticker.events.on('tick', () => this.#tick());
  }

  override setObjects(): void {
    rebuildSurfPoint(this.model);
    super.setObjects();
  }

  #addHideable(mesh: THREE.Mesh): void {
    this.game.scene.add(mesh);
    this.objects.hideable.push(mesh);
  }

  #createFunnel(scale: number, direction: number): void {
    const { noises } = this.game;
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
    const time = this.#swirlTime;
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
    funnel.position.copy(this.#position);
    this.#addHideable(funnel);
  }

  #createDust(): void {
    const { noises } = this.game;
    const time = this.#swirlTime;
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
    dust.position.copy(this.#position);
    dust.position.y += 0.03;
    dust.rotation.x = -Math.PI / 2;
    this.#addHideable(dust);
  }

  #createDebris(): void {
    const { seeds, heights } = debrisData();
    const seed = instancedArray(seeds, 'float').toAttribute();
    const height = instancedArray(heights, 'float').toAttribute();
    const time = this.#swirlTime;
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
    debris.position.copy(this.#position);
    this.#addHideable(debris);
  }

  #createTrigger(): void {
    const zone = this.game.zones.create('cylinder', this.#position.clone(), TRIGGER.radius);
    zone.events.on('enter', () => this.#startTravel());
  }

  #startTravel(): void {
    const { player, physicalVehicle, ticker } = this.game;
    const isAirborne = player.position.y - this.#position.y > TRIGGER.maxHeight;
    const isCoolingDown = ticker.elapsed - this.#lastTrigger < TRIGGER.cooldown;
    if (this.#travelSequence !== null || isAirborne || isCoolingDown) return;
    this.#lastTrigger = ticker.elapsed;
    this.#travelSequence = player.respawnSequence;
    player.state = Player.STATE_LOCKED;
    physicalVehicle.launch({ upward: LIFT.upward, spin: LIFT.spin, carry: LIFT.carry });
    this.#lift.play();
    this.#surge();
    this.#liftCall = gsap.delayedCall(LIFT.duration, () => this.#teleport());
  }

  #teleport(): void {
    const { player, view, notifications } = this.game;
    this.#liftCall = null;
    const destination = pickTornadoDestination({
      places: ISLAND_PLACES.map(({ respawnName }) => respawnName),
      visited: this.#visited,
      origin: ORIGIN,
      random: Math.random,
    });
    const place = ISLAND_PLACES.find(({ respawnName }) => respawnName === destination);
    const isInterrupted = player.respawnSequence !== this.#travelSequence;
    if (isInterrupted || !place) {
      this.#endTravel();
      if (!isInterrupted) player.state = Player.STATE_DEFAULT;
      return;
    }
    player.respawn(place.respawnName, () => {
      view.focusPoint.isTracking = true;
      this.#visited.add(place.respawnName);
      this.#endTravel();
      notifications.show(arrivalNotice(place), { type: 'arrival', duration: NOTICE_DURATION });
    });
    this.#travelSequence = player.respawnSequence;
  }

  #endTravel(): void {
    this.#liftCall?.kill();
    this.#liftCall = null;
    this.#travelSequence = null;
  }

  #surge(): void {
    gsap.to(this.#spin, {
      value: SPIN.surge,
      duration: SPIN.surgeIn,
      ease: 'power2.out',
      onComplete: () => {
        gsap.to(this.#spin, { value: SPIN.idle, duration: SPIN.surgeOut, ease: 'power2.inOut' });
      },
    });
  }

  #tick(): void {
    const { ticker, player, respawns } = this.game;
    this.#swirlTime.value += ticker.deltaScaled * this.#spin.value;
    if (this.#travelSequence !== null && player.respawnSequence !== this.#travelSequence) this.#endTravel();
    if (this.#liftCall) this.game.physicalVehicle.launch({ upward: LIFT.updraft * ticker.deltaScaled });
    this.#visitTimer -= ticker.delta;
    if (this.#visitTimer > 0) return;
    this.#visitTimer = VISIT.interval;
    for (const { respawnName } of ISLAND_PLACES) {
      const { position } = respawns.getByName(respawnName);
      if (Math.hypot(position.x - player.position.x, position.z - player.position.z) < VISIT.radius) {
        this.#visited.add(respawnName);
      }
    }
  }
}
