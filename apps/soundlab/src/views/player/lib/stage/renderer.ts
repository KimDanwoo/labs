import {
  BLOOM_BASE,
  BLOOM_PER_AIR,
  BLOOM_PER_HIT,
  BLOOM_PER_SWELL,
  BLOOM_SHIFT,
  DEPTH_BASE,
  DEPTH_PER_SWELL,
  GRID_MAX,
  GRID_MIN,
  MAX_DEVICE_PIXELS,
  SIZE_PER_HIT,
} from '@views/player/config/renderer';
import { createFrameSkip } from '@views/player/lib/stage/frameSkip';
import { clearTargets, deleteTargets, gridUv, makeTargetPair, type Target } from '@views/player/lib/stage/glKit';
import { createRenderPasses } from '@views/player/lib/stage/renderPasses';
import { createRendererResources, disposeRendererResources } from '@views/player/lib/stage/rendererResources';

type RenderInput = {
  morph: number;
  level: number;
  decay: number;
  swell?: number;
  pre?: number;
  hit?: number;
  air?: number;
  ripples?: Float32Array;
  rippleSeeds?: Float32Array;
};

export type Renderer = {
  layout: (slot: DOMRect) => void;
  setArtwork: (image: TexImageSource) => void;
  render: (input: RenderInput) => void;
  dispose: () => void;
};

function accentsOf({ swell = 0, pre = 0, hit = 0, air = 0 }: RenderInput) {
  return { swell, pre, hit, air };
}

function hasLiveRipple(ripples: Float32Array | undefined): boolean {
  if (!ripples) return false;
  for (let i = 2; i < ripples.length; i += 4) {
    if ((ripples[i] ?? 1) < 1) return true;
  }
  return false;
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const context = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!context) return null;
  const gl: WebGL2RenderingContext = context;

  const resources = createRendererResources(gl);
  const { uvBuffer, artwork } = resources;
  const passes = createRenderPasses(gl, canvas, resources);

  gl.disable(gl.DEPTH_TEST);

  let accum: [Target, Target] | null = null;
  let bloom: [Target, Target] | null = null;
  let accumIndex = 0;
  let grid = 0;
  let count = 0;
  let cssWidth = 0;
  let cssHeight = 0;
  let dpr = 1;
  let side = 300;
  let centerX = 0;
  let centerY = 0;
  const frameSkip = createFrameSkip();

  function releaseTargets() {
    deleteTargets(gl, [...(accum ?? []), ...(bloom ?? [])]);
    accum = null;
    bloom = null;
  }

  function ensureGrid() {
    const next = Math.max(GRID_MIN, Math.min(GRID_MAX, Math.round((side * dpr) / 1.9)));
    if (next === grid) return;
    grid = next;
    count = next * next;
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, gridUv(next), gl.STATIC_DRAW);
  }

  function layout(slot: DOMRect) {
    cssWidth = canvas.clientWidth;
    cssHeight = canvas.clientHeight;

    const area = Math.max(1, cssWidth * cssHeight);
    const wanted = Math.min(2, globalThis.devicePixelRatio || 1);
    dpr = Math.max(1, Math.min(wanted, Math.sqrt(MAX_DEVICE_PIXELS / area)));

    const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
    const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));

    const shouldResize = canvas.width !== pixelWidth || canvas.height !== pixelHeight || !accum;
    if (shouldResize) {
      releaseTargets();
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      accum = makeTargetPair(gl, pixelWidth, pixelHeight);
      bloom = makeTargetPair(gl, Math.max(1, pixelWidth >> BLOOM_SHIFT), Math.max(1, pixelHeight >> BLOOM_SHIFT));
      clearTargets(gl, accum);
    }

    side = slot.width;
    centerX = slot.left + slot.width / 2 - cssWidth / 2;
    centerY = cssHeight / 2 - (slot.top + slot.height / 2);
    ensureGrid();
    frameSkip.invalidate();
  }

  function setArtwork(image: TexImageSource) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, artwork);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    frameSkip.invalidate();
  }

  function render(input: RenderInput) {
    const { morph, level, decay, ripples, rippleSeeds } = input;
    const { swell, pre, hit, air } = accentsOf(input);
    if (!accum) return;
    if (!bloom) return;
    if (count === 0) return;

    const rippleAlive = hasLiveRipple(ripples);
    const accented = pre > 0 || hit > 0;
    if (frameSkip.shouldSkip({ morph, level: level + swell + air, decay, rippleAlive, accented })) return;

    const source = accum[accumIndex];
    const destination = accum[accumIndex ^ 1];
    if (!source) return;
    if (!destination) return;

    passes.fadeInto(source, destination, decay);
    passes.drawParticles({
      width: cssWidth,
      height: cssHeight,
      centerX,
      centerY,
      side,
      morph,
      level,
      pre,
      size: Math.max(1.5, (side / grid) * dpr * 1.72) * (1 + hit * SIZE_PER_HIT),
      depth: side * (DEPTH_BASE + swell * DEPTH_PER_SWELL),
      ripples,
      rippleSeeds,
      count,
    });
    passes.bloomAndComposite(
      destination,
      bloom,
      hit,
      BLOOM_BASE + swell * BLOOM_PER_SWELL + hit * BLOOM_PER_HIT + air * BLOOM_PER_AIR,
    );

    accumIndex ^= 1;
  }

  function dispose() {
    releaseTargets();
    disposeRendererResources(gl, resources);
  }

  return { layout, setArtwork, render, dispose };
}
