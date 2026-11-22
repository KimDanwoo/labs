import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { add, pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { cheapDOF } from '@views/drive/lib/engine/game/passes/cheapDOF';
import {
  castsShadow,
  collectShadowVariants,
  disableFrustumCulling,
  exposeWholeScene,
  revealHiddenObjects,
  warmShadowPipelines,
  whenShadowSetUp,
} from '@views/drive/lib/engine/game/preRenderer';
import { QUALITY, type QualityLevel } from '@views/drive/lib/engine/game/quality';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';

const MAX_ANTIALIAS_PIXEL_RATIO = 1.5;
const BLOOM = {
  threshold: 1,
  strength: 0.25,
  smoothWidth: 1,
  resolutionByQuality: { [QUALITY.high]: 0.5, [QUALITY.low]: 0.25 },
} as const;

interface Sortable {
  renderOrder: number | null;
}

const SETTLE_FRAMES = 2;
const nextFrame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()));

const byRenderOrder = (a: Sortable, b: Sortable): number => (a.renderOrder ?? 0) - (b.renderOrder ?? 0);

export class Rendering {
  readonly game = getGame();
  readonly renderer: THREE.WebGPURenderer;
  #pipeline: THREE.RenderPipeline | null = null;
  #scenePass: ReturnType<typeof pass> | null = null;
  #isPaused = false;
  #isCompilingOffscreen = false;

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
    this.game.ticker.events.on('tick', () => this.render(), TICK_ORDER.rendering);
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

    const dofPass = cheapDOF(sceneColor);

    const applyQuality = (level: QualityLevel): void => {
      bloomPass.setResolutionScale(BLOOM.resolutionByQuality[level]);
      pipeline.outputNode = add(level === QUALITY.high ? dofPass : sceneColor, bloomPass);
      pipeline.needsUpdate = true;
    };
    applyQuality(this.game.quality.level);
    this.game.quality.events.on('change', applyQuality);
    this.#pipeline = pipeline;
    this.#scenePass = scenePass;
  }

  resize(): void {
    const { width, height, pixelRatio } = this.game.viewport;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pixelRatio);
  }

  render(): void {
    if (this.#isPaused) return;
    if (this.#isCompilingOffscreen) this.#resetLeakedCompileTarget();
    this.#pipeline?.render();
  }

  async precompile(): Promise<void> {
    const scenePass = this.#scenePass;
    if (!scenePass) return;
    this.#isPaused = true;
    try {
      for (let frame = 0; frame < SETTLE_FRAMES; frame++) await nextFrame();
      const { scene, lighting } = this.game;
      const shadowSetUp = whenShadowSetUp(lighting.light);
      const compiled = scenePass.compileAsync(this.renderer);
      const warmed = Promise.race([shadowSetUp, compiled])
        .then(nextFrame)
        .then(() => warmShadowPipelines(this.renderer, scene, lighting.light, castsShadow));
      await Promise.all([compiled, warmed]);
    } finally {
      this.#isPaused = false;
    }
  }

  async precompileOffscreen(): Promise<void> {
    const scenePass = this.#scenePass;
    if (!scenePass) return;
    this.#isCompilingOffscreen = true;
    try {
      const restoreScene = exposeWholeScene(this.game.scene);
      const compiled = scenePass.compileAsync(this.renderer);
      restoreScene();
      await compiled;
    } finally {
      this.#isCompilingOffscreen = false;
    }
    await this.#warmOffscreenShadows();
  }

  async #warmOffscreenShadows(): Promise<void> {
    const { scene, lighting } = this.game;
    for (const caster of collectShadowVariants(scene)) {
      await nextFrame();
      const hideAgain = revealHiddenObjects(scene);
      const cullAgain = disableFrustumCulling(scene);
      warmShadowPipelines(this.renderer, scene, lighting.light, (object) => object === caster);
      cullAgain();
      hideAgain();
    }
  }

  #resetLeakedCompileTarget(): void {
    this.renderer.setRenderTarget(null);
    this.renderer.setMRT(null);
  }

  isWebGPU(): boolean {
    const { backend } = this.renderer;
    return 'isWebGPUBackend' in backend && backend.isWebGPUBackend === true;
  }
}
