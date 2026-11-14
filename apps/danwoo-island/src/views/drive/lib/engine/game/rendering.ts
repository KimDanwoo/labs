import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { add, pass, renderOutput } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from './gameContext';
import { cheapDOF } from './passes/cheapDOF';
import { QUALITY, type QualityLevel } from './quality';

const TICK_ORDER = 998;
const MAX_ANTIALIAS_PIXEL_RATIO = 2;
const BLOOM = {
  threshold: 1,
  strength: 0.25,
  smoothWidth: 1,
  mipsByQuality: { [QUALITY.high]: 5, [QUALITY.low]: 2 },
} as const;

const BLOOM_MIPS_FIELD = '_nMips';

interface Sortable {
  renderOrder: number | null;
}

const byRenderOrder = (a: Sortable, b: Sortable): number => (a.renderOrder ?? 0) - (b.renderOrder ?? 0);

export class Rendering {
  readonly game = getGame();
  readonly renderer: THREE.WebGPURenderer;
  #pipeline: THREE.RenderPipeline | null = null;

  constructor() {
    const { viewport } = this.game;
    this.renderer = new THREE.WebGPURenderer({
      canvas: this.game.canvasElement,
      powerPreference: 'high-performance',
      forceWebGL: false,
      antialias: viewport.pixelRatio < MAX_ANTIALIAS_PIXEL_RATIO,
    });
    this.renderer.sortObjects = false;
    this.renderer.shadowMap.enabled = true;
    this.renderer.setOpaqueSort(byRenderOrder);
    this.renderer.setTransparentSort(byRenderOrder);
    this.renderer.domElement.classList.add('experience');
    this.resize();
  }

  async setRenderer(): Promise<void> {
    this.renderer.setAnimationLoop((timestamp) => this.game.ticker.update(timestamp));
    await this.renderer.init();
  }

  start(): void {
    this.game.ticker.events.on('tick', () => this.render(), TICK_ORDER);
    this.game.viewport.events.on('change', () => this.resize());
  }

  setPostprocessing(): void {
    const pipeline = new THREE.RenderPipeline(this.renderer);
    const camera = this.game.view.camera;
    if (!camera) throw new Error('View camera is not ready');
    const scenePass = pass(this.game.scene, camera);
    const sceneColor = scenePass.getTextureNode('output');
    const bloomPass = bloom(sceneColor);
    bloomPass.threshold.value = BLOOM.threshold;
    bloomPass.strength.value = BLOOM.strength;
    bloomPass.smoothWidth.value = BLOOM.smoothWidth;
    Reflect.set(bloomPass, BLOOM_MIPS_FIELD, BLOOM.mipsByQuality[this.game.quality.level]);
    const dofPass = cheapDOF(renderOutput(scenePass));

    const applyQuality = (level: QualityLevel): void => {
      pipeline.outputNode = add(level === QUALITY.high ? dofPass : sceneColor, bloomPass);
      pipeline.needsUpdate = true;
    };
    applyQuality(this.game.quality.level);
    this.game.quality.events.on('change', applyQuality);
    this.#pipeline = pipeline;
  }

  resize(): void {
    const { width, height, pixelRatio } = this.game.viewport;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pixelRatio);
  }

  render(): void {
    this.#pipeline?.render();
  }

  isWebGPU(): boolean {
    const { backend } = this.renderer;
    return 'isWebGPUBackend' in backend && backend.isWebGPUBackend === true;
  }
}
