/**
 * 픽셀 파티클 렌더러. React와 분리된 순수 WebGL2 모듈이다.
 *
 * 파이프라인: 파티클 → 누적 FBO(장노출 트레일) → 브라이트패스 → 블러 2패스 → 합성.
 * 누적 버퍼는 빛만 담고(검정으로 clear) 배경색은 합성 단계에서 더한다.
 * 그래야 트레일이 배경색과 정확히 맞물린다.
 *
 * 파라미터는 목업에서 headless 렌더로 검증한 값이다. 근거는 docs/soundlab-prd.md §6.
 */

const LUM = 'vec3(0.2126, 0.7152, 0.0722)';
const BACKGROUND: readonly [number, number, number] = [5 / 255, 6 / 255, 7 / 255];

/** 동시에 살아 있는 클릭 파동 수. 1개면 연타할 때 앞 파동이 잘려 튄다. */
export const RIPPLE_SLOTS = 3;
/** 꺼진 슬롯(z >= 1)로 채운 기본값. ripples를 안 넘기는 호출자를 위해 쓴다. */
const IDLE_RIPPLES = new Float32Array(Array.from({ length: RIPPLE_SLOTS }, () => [0, 0, 1]).flat());

const GRID_MIN = 120;
const GRID_MAX = 288;
const BLOOM_THRESHOLD = 0.7;
const BLOOM_AMOUNT = 0.62;

const VERT_POINTS = `#version 300 es
precision highp float;
in vec2 a_uv;
uniform sampler2D uTex;
uniform vec2 uRes, uCenter;
uniform float uMorph, uLevel, uSize, uSide, uDepth, uFocal;
/** 파동 슬롯: xy = 원점(캔버스 중심 기준 CSS px), z = 진행도 0~1. z >= 1 이면 꺼진 슬롯. */
uniform vec3 uRipples[${RIPPLE_SLOTS}];
out vec3 v_color;
out float v_alpha;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 tuv = vec2(a_uv.x, 1.0 - a_uv.y);
  vec3 c = texture(uTex, tuv).rgb;
  v_color = c;

  // 깊이는 저주파 휘도로 — 픽셀 단위로 쓰면 이웃의 원근 배율이 달라져 스페클이 된다.
  const float E = 0.006;
  float lum = dot(c, ${LUM}) * 0.4
    + dot(texture(uTex, tuv + vec2(E, 0.0)).rgb, ${LUM}) * 0.15
    + dot(texture(uTex, tuv - vec2(E, 0.0)).rgb, ${LUM}) * 0.15
    + dot(texture(uTex, tuv + vec2(0.0, E)).rgb, ${LUM}) * 0.15
    + dot(texture(uTex, tuv - vec2(0.0, E)).rgb, ${LUM}) * 0.15;

  // 휘도 순서로 도착한다 — 어두운 곳이 먼저 자리잡고 조명이 마지막에 켜진다.
  float delay = lum * 0.44;
  float m = clamp((uMorph - delay) / max(0.2, 1.0 - delay), 0.0, 1.0);

  vec2 rel = (a_uv - 0.5) * uSide;

  // 시작 자리: 화면 전체에 흩어지되 확대된 이미지의 구조가 희미하게 남는다.
  float fill = max(uRes.x, uRes.y) / max(1.0, uSide) * 1.35;
  vec2 spread = (vec2(hash(a_uv * 13.3), hash(a_uv * 91.7)) - 0.5) * uRes * 1.12;
  vec2 away = mix(spread, rel * fill, 0.35);

  // 집결 상태의 호흡은 좌표를 섞지 않는 균일 확대로만 준다.
  vec2 rp = mix(away, rel, m) * (1.0 + uLevel * 0.009 * m);
  vec2 origin = mix(vec2(0.0), uCenter, m);

  // 클릭 파동. 액자 가장자리로 갈수록 변위를 0으로 죽인다 — 안 그러면 밀려난 픽셀이
  // 정사각 실루엣 밖으로 새어 테두리가 터진다. m을 곱해 흩어진 동안은 반응하지 않는다.
  vec2 fromEdge = min(a_uv, 1.0 - a_uv);
  float inside = smoothstep(0.0, 0.12, min(fromEdge.x, fromEdge.y)) * m;
  float lift = 0.0;
  if (inside > 0.001) {
    vec2 world = origin + rp;
    for (int i = 0; i < ${RIPPLE_SLOTS}; i++) {
      float age = uRipples[i].z;
      if (age >= 1.0) continue;
      float dist = length(world - uRipples[i].xy);
      // 파면은 수명 동안 액자 반대편까지 간다(반대각선 0.707 < 0.8).
      float x = (dist - age * uSide * 0.8) / (uSide * 0.1);
      // 가우시안 미분 — 파면 앞뒤로 부호가 뒤집혀 마루와 골이 생긴다.
      float swing = -2.0 * x * exp(-x * x);
      // 순수 횡파 — 높이만 출렁인다. xy를 옆으로 밀면 파면 안쪽 밀도가 빠져 구멍이 뚫린다.
      lift += swing * (1.0 - age) * (1.0 - age) * inside;
    }
  }

  // 마루는 앞으로 솟고 골은 뒤로 꺼진다 — 원근 배율이 그걸 렌즈처럼 부풀려 수면으로 읽힌다.
  float z = (lum - 0.45) * uDepth * m + clamp(lift, -1.5, 1.5) * uDepth * 7.0;
  float persp = uFocal / max(1.0, uFocal - z);

  gl_Position = vec4((origin + rp * persp) / (uRes * 0.5), 0.0, 1.0);
  gl_PointSize = uSize * (1.0 + (1.0 - m) * 1.5) * persp;
  // 크게 펼쳐진 동안은 옅게 — 텍스처 교체 순간이 보이지 않는다.
  v_alpha = 0.05 + m * 0.95;
}`;

const FRAG_POINTS = `#version 300 es
precision highp float;
in vec3 v_color;
in float v_alpha;
out vec4 outColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c);
  if (d > 0.25) discard;
  outColor = vec4(v_color, smoothstep(0.25, 0.03, d) * v_alpha);
}`;

const VERT_QUAD = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG_FADE = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D uSrc;
uniform float uDecay;
out vec4 outColor;
void main() { outColor = vec4(texture(uSrc, v_uv).rgb * uDecay, 1.0); }`;

const FRAG_BRIGHT = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D uSrc;
uniform float uThreshold;
out vec4 outColor;
void main() {
  vec3 c = texture(uSrc, v_uv).rgb;
  float l = dot(c, ${LUM});
  outColor = vec4(c * max(0.0, l - uThreshold) / max(0.001, 1.0 - uThreshold), 1.0);
}`;

const FRAG_BLUR = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D uSrc;
uniform vec2 uDir;
out vec4 outColor;
const float W[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
void main() {
  vec3 s = texture(uSrc, v_uv).rgb * W[0];
  for (int i = 1; i < 5; i++) {
    s += texture(uSrc, v_uv + uDir * float(i)).rgb * W[i];
    s += texture(uSrc, v_uv - uDir * float(i)).rgb * W[i];
  }
  outColor = vec4(s, 1.0);
}`;

const FRAG_COMPOSITE = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D uScene, uBloom;
uniform vec3 uBg;
uniform float uBloomAmt;
out vec4 outColor;
void main() {
  vec3 c = uBg + texture(uScene, v_uv).rgb + texture(uBloom, v_uv).rgb * uBloomAmt;
  outColor = vec4(c, 1.0);
}`;

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };
type Target = { texture: WebGLTexture; framebuffer: WebGLFramebuffer; width: number; height: number };

export type RenderInput = {
  morph: number;
  level: number;
  decay: number;
  /** RIPPLE_SLOTS × (x, y, 진행도). 생략하면 파동 없음. */
  ripples?: Float32Array;
};

export type Renderer = {
  /** 캔버스 크기와 .slot 위치를 다시 읽는다. */
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

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('셰이더를 만들 수 없습니다');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) ?? '셰이더 컴파일 실패');
    }
    return shader;
  };

  const link = (vertexSource: string, fragmentSource: string, names: readonly string[]): Program => {
    const program = gl.createProgram();
    if (!program) throw new Error('프로그램을 만들 수 없습니다');
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? '프로그램 링크 실패');
    }
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (const name of names) uniforms[name] = gl.getUniformLocation(program, name);
    return { program, uniforms };
  };

  const makeTarget = (width: number, height: number): Target => {
    const texture = gl.createTexture();
    const framebuffer = gl.createFramebuffer();
    if (!texture || !framebuffer) throw new Error('렌더 타깃을 만들 수 없습니다');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { texture, framebuffer, width, height };
  };

  const points = link(VERT_POINTS, FRAG_POINTS, [
    'uTex',
    'uRes',
    'uCenter',
    'uMorph',
    'uLevel',
    'uSize',
    'uSide',
    'uDepth',
    'uFocal',
    'uRipples[0]',
  ]);
  const fade = link(VERT_QUAD, FRAG_FADE, ['uSrc', 'uDecay']);
  const bright = link(VERT_QUAD, FRAG_BRIGHT, ['uSrc', 'uThreshold']);
  const blur = link(VERT_QUAD, FRAG_BLUR, ['uSrc', 'uDir']);
  const composite = link(VERT_QUAD, FRAG_COMPOSITE, ['uScene', 'uBloom', 'uBg', 'uBloomAmt']);

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
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

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

  function ensureGrid() {
    // 격자는 실제 표시 크기에 맞춘다 — 좁은 화면에서 8만 개를 그리지 않는다.
    const next = Math.max(GRID_MIN, Math.min(GRID_MAX, Math.round((side * dpr) / 1.9)));
    if (next === grid) return;
    grid = next;
    count = next * next;
    const uv = new Float32Array(count * 2);
    for (let y = 0, i = 0; y < next; y++) {
      for (let x = 0; x < next; x++) {
        uv[i++] = (x + 0.5) / next;
        uv[i++] = (y + 0.5) / next;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
  }

  function layout(slot: DOMRect) {
    dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    cssWidth = canvas.clientWidth;
    cssHeight = canvas.clientHeight;
    const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
    const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight || !accum) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      accum = [makeTarget(pixelWidth, pixelHeight), makeTarget(pixelWidth, pixelHeight)];
      bloom = [
        makeTarget(Math.max(1, pixelWidth >> 1), Math.max(1, pixelHeight >> 1)),
        makeTarget(Math.max(1, pixelWidth >> 1), Math.max(1, pixelHeight >> 1)),
      ];
      for (const target of accum) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // 파티클이 모일 자리를 예약 칸에서 그대로 읽는다. 눈대중 오프셋을 두지 않는다.
    side = slot.width;
    centerX = slot.left + slot.width / 2 - cssWidth / 2;
    centerY = cssHeight / 2 - (slot.top + slot.height / 2);
    ensureGrid();
  }

  function setArtwork(image: TexImageSource) {
    gl.bindTexture(gl.TEXTURE_2D, artwork);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }

  function bindTexture(unit: number, texture: WebGLTexture, location: WebGLUniformLocation | null) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(location, unit);
  }

  function quadPass(target: Target | null, prepared: Program, bind: () => void) {
    gl.useProgram(prepared.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    gl.viewport(0, 0, target ? target.width : canvas.width, target ? target.height : canvas.height);
    bind();
    gl.bindVertexArray(quadVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function render({ morph, level, decay, ripples }: RenderInput) {
    if (!accum || !bloom || count === 0) return;
    const source = accum[accumIndex];
    const destination = accum[accumIndex ^ 1];
    if (!source || !destination) return;
    const [bloomA, bloomB] = bloom;

    // 1) 이전 프레임을 감쇠시켜 옮긴다. 정지 상태면 그냥 지운다(선명하게 남는다).
    gl.disable(gl.BLEND);
    if (decay > 0.02) {
      quadPass(destination, fade, () => {
        bindTexture(0, source.texture, fade.uniforms.uSrc ?? null);
        gl.uniform1f(fade.uniforms.uDecay ?? null, decay);
      });
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, destination.framebuffer);
      gl.viewport(0, 0, destination.width, destination.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // 2) 파티클
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(points.program);
    bindTexture(0, artwork, points.uniforms.uTex ?? null);
    gl.uniform2f(points.uniforms.uRes ?? null, cssWidth, cssHeight);
    gl.uniform2f(points.uniforms.uCenter ?? null, centerX, centerY);
    gl.uniform1f(points.uniforms.uSide ?? null, side);
    gl.uniform1f(points.uniforms.uMorph ?? null, morph);
    gl.uniform1f(points.uniforms.uLevel ?? null, level);
    gl.uniform1f(points.uniforms.uSize ?? null, Math.max(1.5, (side / grid) * dpr * 1.72));
    gl.uniform1f(points.uniforms.uDepth ?? null, side * 0.12);
    gl.uniform1f(points.uniforms.uFocal ?? null, 1600);
    gl.uniform3fv(points.uniforms['uRipples[0]'] ?? null, ripples ?? IDLE_RIPPLES);
    gl.bindVertexArray(pointsVao);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.disable(gl.BLEND);

    // 3) 블룸 — 브라이트패스 후 가로·세로 블러
    quadPass(bloomA, bright, () => {
      bindTexture(0, destination.texture, bright.uniforms.uSrc ?? null);
      gl.uniform1f(bright.uniforms.uThreshold ?? null, BLOOM_THRESHOLD);
    });
    quadPass(bloomB, blur, () => {
      bindTexture(0, bloomA.texture, blur.uniforms.uSrc ?? null);
      gl.uniform2f(blur.uniforms.uDir ?? null, 1.4 / bloomA.width, 0);
    });
    quadPass(bloomA, blur, () => {
      bindTexture(0, bloomB.texture, blur.uniforms.uSrc ?? null);
      gl.uniform2f(blur.uniforms.uDir ?? null, 0, 1.4 / bloomB.height);
    });

    // 4) 합성 — 누적 버퍼는 빛만 담으므로 배경색을 여기서 더한다.
    quadPass(null, composite, () => {
      bindTexture(0, destination.texture, composite.uniforms.uScene ?? null);
      bindTexture(1, bloomA.texture, composite.uniforms.uBloom ?? null);
      gl.uniform3f(composite.uniforms.uBg ?? null, BACKGROUND[0], BACKGROUND[1], BACKGROUND[2]);
      gl.uniform1f(composite.uniforms.uBloomAmt ?? null, BLOOM_AMOUNT);
    });

    accumIndex ^= 1;
  }

  function dispose() {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  return { layout, setArtwork, render, dispose };
}
