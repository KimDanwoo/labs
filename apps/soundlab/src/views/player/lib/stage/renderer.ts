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
} from '../../config/renderer';
import { createFrameSkip } from './frameSkip';
import { clearTargets, deleteTargets, gridUv, makeTargetPair, type Target } from './glKit';
import { createRenderPasses } from './renderPasses';
import { createRendererResources, disposeRendererResources } from './rendererResources';

/**
 * 픽셀 파티클 렌더러. React와 분리된 순수 WebGL2 모듈이다.
 *
 * 파이프라인: 파티클 → 누적 FBO(장노출 트레일) → 브라이트패스 → 블러 2패스 → 합성.
 * 누적 버퍼는 빛만 담고(검정으로 clear) 배경색은 합성 단계에서 더한다.
 * 그래야 트레일이 배경색과 정확히 맞물린다.
 *
 * 파라미터는 목업에서 headless 렌더로 검증한 값이다.
 */

type RenderInput = {
  morph: number;
  level: number;
  decay: number;
  /**
   * 음악 신호 채널. 전부 생략 가능하고 없으면 0 — 신호 없는 상태가 곧 기본값이다.
   * 필수로 두면 타입 검사가 닿지 않는 호출자(scripts/shoot-og.mjs가 문자열로 만드는 페이지)에서
   * undefined가 uniform에 들어가 NaN이 되고 파티클이 전부 사라진다.
   */
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

export function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const context = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!context) return null;
  // 호이스팅되는 function 선언 안에서는 narrowing이 유지되지 않는다. 타입을 확정해 둔다.
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

    // 픽셀 예산을 넘는 화면에서는 dpr을 깎는다. 1 아래로는 안 내려간다 — 그 아래는 확대가 눈에 보인다.
    const area = Math.max(1, cssWidth * cssHeight);
    const wanted = Math.min(2, globalThis.devicePixelRatio || 1);
    dpr = Math.max(1, Math.min(wanted, Math.sqrt(MAX_DEVICE_PIXELS / area)));

    const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
    const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight || !accum) {
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
    // 마지막 패스가 유닛 1을 잡아둔 채로 들어올 수 있다. 어느 유닛에 올릴지 명시한다.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, artwork);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    frameSkip.invalidate();
  }

  function render({ morph, level, decay, swell = 0, pre = 0, hit = 0, air = 0, ripples, rippleSeeds }: RenderInput) {
    if (!accum || !bloom || count === 0) return;

    let rippleAlive = false;
    if (ripples) {
      for (let i = 2; i < ripples.length; i += 4) {
        if ((ripples[i] ?? 1) < 1) rippleAlive = true;
      }
    }
    const accented = pre > 0 || hit > 0;
    if (frameSkip.shouldSkip({ morph, level: level + swell + air, decay, rippleAlive, accented })) return;

    const source = accum[accumIndex];
    const destination = accum[accumIndex ^ 1];
    if (!source || !destination) return;

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
    // Strict Mode는 같은 canvas로 다시 setup한다. 컨텍스트는 유지하고 소유 자원만 해제한다.
    releaseTargets();
    disposeRendererResources(gl, resources);
  }

  return { layout, setArtwork, render, dispose };
}
