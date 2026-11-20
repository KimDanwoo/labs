import {
  BACKGROUND,
  BLOOM_THRESHOLD,
  BLUR_PX,
  IDLE_RIPPLES,
  IDLE_SEEDS,
  STATIC_DECAY,
  THRESHOLD_PER_HIT,
} from '@views/player/config/renderer';
import { bindTexture, type Program, type Target } from '@views/player/lib/stage/glKit';
import type { RendererResources } from '@views/player/lib/stage/rendererResources';

export type ParticleUniforms = {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  side: number;
  morph: number;
  level: number;
  pre: number;
  size: number;
  depth: number;
  ripples?: Float32Array;
  rippleSeeds?: Float32Array;
  count: number;
};

export function createRenderPasses(
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement,
  resources: RendererResources,
) {
  const { points, fade, bright, blur, composite, quadVao, pointsVao, artwork } = resources;

  function quadPass(target: Target | null, prepared: Program, bind: () => void) {
    gl.useProgram(prepared.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    gl.viewport(0, 0, target ? target.width : canvas.width, target ? target.height : canvas.height);
    bind();
    gl.bindVertexArray(quadVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function fadeInto(source: Target, destination: Target, decay: number) {
    gl.disable(gl.BLEND);
    if (decay > STATIC_DECAY) {
      quadPass(destination, fade, () => {
        bindTexture(gl, 0, source.texture, fade.uniforms.uSrc ?? null);
        gl.uniform1f(fade.uniforms.uDecay ?? null, decay);
      });
      return;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, destination.framebuffer);
    gl.viewport(0, 0, destination.width, destination.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  function drawParticles(input: ParticleUniforms) {
    const at = (name: string) => points.uniforms[name] ?? null;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(points.program);
    bindTexture(gl, 0, artwork, at('uTex'));
    gl.uniform2f(at('uRes'), input.width, input.height);
    gl.uniform2f(at('uCenter'), input.centerX, input.centerY);
    gl.uniform1f(at('uSide'), input.side);
    gl.uniform1f(at('uMorph'), input.morph);
    gl.uniform1f(at('uLevel'), input.level);
    gl.uniform1f(at('uPre'), input.pre);
    gl.uniform1f(at('uSize'), input.size);
    gl.uniform1f(at('uDepth'), input.depth);
    gl.uniform1f(at('uFocal'), 1600);
    gl.uniform4fv(at('uRipples[0]'), input.ripples ?? IDLE_RIPPLES);
    gl.uniform1fv(at('uRippleSeeds[0]'), input.rippleSeeds ?? IDLE_SEEDS);
    gl.bindVertexArray(pointsVao);
    gl.drawArrays(gl.POINTS, 0, input.count);
    gl.disable(gl.BLEND);
  }

  function bloomAndComposite(scene: Target, [bloomA, bloomB]: [Target, Target], hit: number, bloomAmount: number) {
    quadPass(bloomA, bright, () => {
      bindTexture(gl, 0, scene.texture, bright.uniforms.uSrc ?? null);
      gl.uniform1f(bright.uniforms.uThreshold ?? null, BLOOM_THRESHOLD - hit * THRESHOLD_PER_HIT);
    });
    // uDir은 uv 단위다. 블룸 타깃 크기가 아니라 캔버스로 나눠 화면상 반경을 축소배율과 무관하게 고정한다.
    quadPass(bloomB, blur, () => {
      bindTexture(gl, 0, bloomA.texture, blur.uniforms.uSrc ?? null);
      gl.uniform2f(blur.uniforms.uDir ?? null, BLUR_PX / canvas.width, 0);
    });
    quadPass(bloomA, blur, () => {
      bindTexture(gl, 0, bloomB.texture, blur.uniforms.uSrc ?? null);
      gl.uniform2f(blur.uniforms.uDir ?? null, 0, BLUR_PX / canvas.height);
    });

    quadPass(null, composite, () => {
      bindTexture(gl, 0, scene.texture, composite.uniforms.uScene ?? null);
      bindTexture(gl, 1, bloomA.texture, composite.uniforms.uBloom ?? null);
      gl.uniform3f(composite.uniforms.uBg ?? null, BACKGROUND[0], BACKGROUND[1], BACKGROUND[2]);
      gl.uniform1f(composite.uniforms.uBloomAmt ?? null, bloomAmount);
    });
  }

  return { fadeInto, drawParticles, bloomAndComposite };
}
