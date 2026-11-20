import { link } from '@views/player/lib/stage/glKit';
import {
  FRAG_BLUR,
  FRAG_BRIGHT,
  FRAG_COMPOSITE,
  FRAG_FADE,
  FRAG_POINTS,
  VERT_POINTS,
  VERT_QUAD,
} from '@views/player/lib/stage/shaders';

export type RendererResources = ReturnType<typeof createRendererResources>;

export function createRendererResources(gl: WebGL2RenderingContext) {
  const points = link(gl, VERT_POINTS, FRAG_POINTS, [
    'uTex',
    'uRes',
    'uCenter',
    'uMorph',
    'uLevel',
    'uPre',
    'uSize',
    'uSide',
    'uDepth',
    'uFocal',
    'uRipples[0]',
    'uRippleSeeds[0]',
  ]);
  const fade = link(gl, VERT_QUAD, FRAG_FADE, ['uSrc', 'uDecay']);
  const bright = link(gl, VERT_QUAD, FRAG_BRIGHT, ['uSrc', 'uThreshold']);
  const blur = link(gl, VERT_QUAD, FRAG_BLUR, ['uSrc', 'uDir']);
  const composite = link(gl, VERT_QUAD, FRAG_COMPOSITE, ['uScene', 'uBloom', 'uBg', 'uBloomAmt']);

  const quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const pointsVao = gl.createVertexArray();
  gl.bindVertexArray(pointsVao);
  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const artwork = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, artwork);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // 정점 셰이더가 저주파 휘도를 밉에서 읽는다. 밉이 없으면 텍스처가 불완전해져 검게 나온다.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  gl.generateMipmap(gl.TEXTURE_2D);

  return { points, fade, bright, blur, composite, quadVao, quadBuffer, pointsVao, uvBuffer, artwork };
}

export function disposeRendererResources(gl: WebGL2RenderingContext, resources: RendererResources) {
  const { points, fade, bright, blur, composite, quadVao, quadBuffer, pointsVao, uvBuffer, artwork } = resources;
  gl.deleteTexture(artwork);
  gl.deleteBuffer(quadBuffer);
  gl.deleteBuffer(uvBuffer);
  gl.deleteVertexArray(quadVao);
  gl.deleteVertexArray(pointsVao);
  for (const prepared of [points, fade, bright, blur, composite]) gl.deleteProgram(prepared.program);
}
