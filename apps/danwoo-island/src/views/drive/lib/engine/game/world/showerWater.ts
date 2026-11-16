import { color, Fn, hash, instanceIndex, mix, smoothstep, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';

const HEAD_HEIGHT = 2.45;
const SHOWER = { topRadius: 0.24, bottomRadius: 0.62, segments: 20, flow: 2.4, streaks: 9 } as const;
const SPLASH = { count: 16, size: 0.08, rate: 1.8, reach: 0.75, height: 0.45 } as const;
const FLOW = { response: 4, visibleFrom: 0.01 } as const;
const COLORS = { water: '#9fe8ec', foam: '#f4fbff' } as const;

export class ShowerWater {
  readonly group = new THREE.Group();
  readonly #flow = uniform(0);

  constructor() {
    this.group.name = 'showerWater';
    this.group.add(this.#createCurtain(), this.#createSplash());
    this.group.visible = false;
  }

  get flow(): number {
    return this.#flow.value;
  }

  update({ isRunning, delta }: { isRunning: boolean; delta: number }): void {
    this.#flow.value = THREE.MathUtils.damp(this.#flow.value, isRunning ? 1 : 0, FLOW.response, delta);
    this.group.visible = this.#flow.value > FLOW.visibleFrom;
  }

  #createCurtain(): THREE.Mesh {
    const { noises, ticker } = getGame();
    const time = ticker.elapsedScaledUniform;
    const flow = this.#flow;
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide });
    material.outputNode = Fn(() => {
      const streak = texture(noises.perlin, vec2(uv().x.mul(SHOWER.streaks), uv().y.add(time.mul(SHOWER.flow)))).r;
      const foam = smoothstep(0.45, 0.75, streak);
      const fadeOut = smoothstep(0, 0.25, uv().y);
      const alpha = smoothstep(0.3, 0.6, streak).mul(0.75).mul(fadeOut).mul(flow);
      return vec4(mix(color(COLORS.water), color(COLORS.foam), foam), alpha);
    })();
    const geometry = new THREE.CylinderGeometry(
      SHOWER.topRadius,
      SHOWER.bottomRadius,
      HEAD_HEIGHT,
      SHOWER.segments,
      1,
      true,
    );
    geometry.translate(0, HEAD_HEIGHT / 2, 0);
    return new THREE.Mesh(geometry, material);
  }

  #createSplash(): THREE.Mesh {
    const time = getGame().ticker.elapsedScaledUniform;
    const flow = this.#flow;
    const seed = hash(instanceIndex);
    const phase = time.mul(SPLASH.rate).add(seed).fract();
    const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false });
    material.positionNode = Fn(() => {
      const angle = seed.mul(Math.PI * 2);
      const reach = phase.mul(SPLASH.reach).add(0.2);
      const lift = phase.mul(phase.oneMinus()).mul(SPLASH.height).mul(seed.mul(0.6).add(0.7));
      return vec3(angle.cos().mul(reach), lift, angle.sin().mul(reach));
    })();
    material.outputNode = Fn(() => {
      uv().sub(0.5).length().greaterThan(0.5).discard();
      return vec4(color(COLORS.foam), phase.oneMinus().mul(flow));
    })();
    material.scaleNode = phase.oneMinus().mul(0.6).add(0.4);
    const splash = new THREE.Mesh(new THREE.PlaneGeometry(SPLASH.size, SPLASH.size), material);
    splash.count = SPLASH.count;
    splash.frustumCulled = false;
    return splash;
  }
}
