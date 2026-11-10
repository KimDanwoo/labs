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

/**
 * 동시에 살아 있는 파동 수. 1개면 연타할 때 앞 파동이 잘려 튄다.
 * 클릭만 쓰던 때는 3이면 됐지만, 비트마다 파동이 나면 킥 간격(실측 평균 538ms) 안에
 * 앞 파동이 아직 살아 있어 슬롯이 모자란다 — 클릭이 밀려 죽지 않게 늘렸다.
 */
export const RIPPLE_SLOTS = 5;
/** 꺼진 슬롯(z >= 1)로 채운 기본값. ripples를 안 넘기는 호출자를 위해 쓴다. */
const IDLE_RIPPLES = new Float32Array(Array.from({ length: RIPPLE_SLOTS }, () => [0, 0, 1, 0]).flat());
const IDLE_SEEDS = new Float32Array(RIPPLE_SLOTS);

const GRID_MIN = 120;
const GRID_MAX = 288;

/**
 * 음악 악센트(PRD §6). 상수였던 블룸·깊이를 신호가 밀어올린다.
 * swell은 프레이즈 규모로 느리게, hit은 피크 직후에 짧게 터진다.
 */
const BLOOM_THRESHOLD = 0.7;
const BLOOM_BASE = 0.5;
const BLOOM_PER_SWELL = 0.35;
const BLOOM_PER_HIT = 0.5;
const THRESHOLD_PER_HIT = 0.12;
const DEPTH_BASE = 0.12;
const DEPTH_PER_SWELL = 0.06;
const SIZE_PER_HIT = 0.34;
/**
 * 고역 채널 = 하이햇·공기감(원곡 분석 신호가 있는 곡에서만 0이 아니다). 블룸으로 번진다.
 * 0.45에서 평상 변동 96%(0.61~1.20). 절정+비트가 겹친 이론상 최대는 1.80.
 * 저역(킥)은 어느 채널에도 안 물린다 — 깊이에 물렸을 땐 커버가 앞뒤로 튕겨 뺐다.
 */
const BLOOM_PER_AIR = 0.45;
/**
 * 파티클 균일 확대(level)와 들이쉼 수축(pre).
 * PRD §6은 확대 2%였는데 재매핑 뒤에도 폭이 5.2px뿐이라 3.5%(9.1px)로 올렸다 — PRD에서 의도적으로 벗어난 값이다.
 */
const ZOOM_PER_LEVEL = '0.035';
const SHRINK_PER_PRE = '0.012';
/**
 * 클릭 파동의 렌즈 세기 — 마루가 파동 원점에서 멀어지는 방향으로 좌표를 얼마나 확대하는가.
 * 0.4를 넘으면 변위의 도함수가 -1 아래로 내려가 좌표가 접힌다(파면에 크레이즈·구멍).
 * 여유 1.8배를 두고 잡은 값이다.
 * ponytail: 여러 파동의 파면이 같은 반경에서 겹치면 합이 한계를 넘는다. 클릭 1발은 -0.55,
 * 클릭+비트가 반경까지 겹치는 최악이 -0.78 — 셋 이상 겹쳐야 접히므로 따로 막지 않았다.
 */
const RIPPLE_LENS = '0.22';
/**
 * 파동마다 흔드는 전파 속도와 파면 폭. 상수로 두면 연타할 때 같은 파동만 반복된다.
 * 폭을 속도와 같이 올려 speed/width 비를 8 이하로 묶는다 — 접힘 도함수를 지배하는 게 이 비다.
 */
const RIPPLE_SPEED = '(0.68 + seed * 0.26)';
const RIPPLE_WIDTH = '(0.085 + (speed - 0.68) * 0.19)';

/**
 * 저주파 휘도를 읽을 밉 레벨. 500px 아트워크에서 lod 2 = 약 4px 저역 —
 * 이웃 4탭(E=0.006 ≈ 3px)과 같은 대역을 페치 1회로 얻는다.
 */
const LUM_LOD = '2.0';
/** 블룸 타깃 축소 배율(비트 시프트). 블룸은 저주파라 1/4 해상도로도 눈에 안 띄고 필레이트가 4배 싸다. */
const BLOOM_SHIFT = 2;
/** 블러 한 탭의 이동거리(풀해상도 px). 블룸 타깃 크기와 무관하게 화면상 반경을 고정한다. */
const BLUR_PX = 2.8;
/**
 * 렌더 픽셀 상한. 4K·5K에서 dpr 2를 그대로 쓰면 필레이트만으로 프레임 예산을 넘긴다.
 * 파티클은 셰이더에서 자체 AA되고 블룸이 덮으므로 dpr을 내려도 거의 티가 안 난다 —
 * 점 테두리 선명도와 맞바꾸는 값이니, 더 선명하게 원하면 올린다.
 */
const MAX_DEVICE_PIXELS = 3_500_000;

/**
 * 입력이 이만큼도 안 변했으면 그 프레임은 그리지 않는다(정지·수렴 상태에서 파이프라인 전체가 쉰다).
 * morph는 위치로 환산해서 잡은 값 — 흩어진 거리 ~3000px × 5e-5 ≈ 0.15px, 서브픽셀이라 안 보인다.
 * level은 호흡 배율에만 쓰여 0.01 변화가 화면에서 0.04px 이하다.
 */
const MORPH_EPSILON = 5e-5;
const LEVEL_EPSILON = 0.01;
/** 이 이하의 감쇠는 트레일을 지운 것과 같다 — 누적 버퍼가 더 안 변하므로 프레임을 건너뛸 수 있다. */
const STATIC_DECAY = 0.02;

const VERT_POINTS = `#version 300 es
precision highp float;
in vec2 a_uv;
uniform sampler2D uTex;
uniform vec2 uRes, uCenter;
uniform float uMorph, uLevel, uPre, uSize, uSide, uDepth, uFocal;
/**
 * 파동 슬롯: xy = 원점(캔버스 중심 기준 CSS px), z = 진행도 0~1, w = 진폭.
 * z >= 1 이면 꺼진 슬롯. 진폭이 따로 있어야 킥 파동을 클릭보다 약하게 줄 수 있다.
 */
uniform vec4 uRipples[${RIPPLE_SLOTS}];
/** 파동별 시드 0~1. vec4가 xy·진행도·진폭으로 이미 꽉 차서 별도 배열로 보낸다. */
uniform float uRippleSeeds[${RIPPLE_SLOTS}];
out vec3 v_color;
out float v_alpha;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 tuv = vec2(a_uv.x, 1.0 - a_uv.y);
  vec3 c = textureLod(uTex, tuv, 0.0).rgb;

  // 깊이는 저주파 휘도로 — 픽셀 단위로 쓰면 이웃의 원근 배율이 달라져 스페클이 된다.
  // 이웃 4탭 대신 밉맵을 한 번 읽는다. 정점당 페치 6 → 2 (정점 8만 개 × 60fps에서 이게 제일 크다).
  float lum = dot(c, ${LUM}) * 0.4 + dot(textureLod(uTex, tuv, ${LUM_LOD}).rgb, ${LUM}) * 0.6;

  // 휘도 순서로 도착한다 — 어두운 곳이 먼저 자리잡고 조명이 마지막에 켜진다.
  float delay = lum * 0.44;
  float m = clamp((uMorph - delay) / max(0.2, 1.0 - delay), 0.0, 1.0);

  vec2 rel = (a_uv - 0.5) * uSide;

  // 시작 자리: 화면 전체에 흩어지되 확대된 이미지의 구조가 희미하게 남는다.
  float fill = max(uRes.x, uRes.y) / max(1.0, uSide) * 1.35;
  vec2 spread = (vec2(hash(a_uv * 13.3), hash(a_uv * 91.7)) - 0.5) * uRes * 1.12;
  vec2 away = mix(spread, rel * fill, 0.35);

  // 집결 상태의 호흡은 좌표를 섞지 않는 균일 확대로만 준다.
  // 피크 직전에는 들이쉬듯 수축한다 — 파형을 미리 받아 아는 미래라, 반응이 아니라 안배로 읽힌다.
  vec2 rp = mix(away, rel, m) * (1.0 + (uLevel * ${ZOOM_PER_LEVEL} - uPre * ${SHRINK_PER_PRE}) * m);
  vec2 origin = mix(vec2(0.0), uCenter, m);

  // 클릭 파동. 액자 가장자리로 갈수록 세기를 0으로 죽여 테두리에서 잘린 링이 보이지 않게 한다.
  // m을 곱해 흩어진 동안은 반응하지 않는다.
  vec2 fromEdge = min(a_uv, 1.0 - a_uv);
  float inside = smoothstep(0.0, 0.12, min(fromEdge.x, fromEdge.y)) * m;
  float lift = 0.0;
  vec2 push = vec2(0.0);
  if (inside > 0.001) {
    vec2 world = origin + rp;
    for (int i = 0; i < ${RIPPLE_SLOTS}; i++) {
      float age = uRipples[i].z;
      if (age >= 1.0) continue;
      vec2 offset = world - uRipples[i].xy;
      float dist = length(offset);
      float seed = uRippleSeeds[i];
      float speed = ${RIPPLE_SPEED};
      // 파면은 수명 동안 액자 반대편까지 간다(반대각선 0.707 < speed).
      float x = (dist - age * uSide * speed) / (uSide * ${RIPPLE_WIDTH});
      // 가우시안 미분 — 파면 앞뒤로 부호가 뒤집혀 마루와 골이 생긴다.
      float swing = -2.0 * x * exp(-x * x);
      float amp = swing * (1.0 - age) * (1.0 - age) * inside * uRipples[i].w;
      lift += amp;
      // 렌즈 확대는 파동 원점 기준이다. 원점에서 0이라 가운데가 뚫리지 않고,
      // 파면(swing != 0)이 원점 주위 링이라 어디를 눌러도 사방으로 똑같이 퍼진다.
      push += offset * amp * ${RIPPLE_LENS};
    }
  }

  // 원근은 휘도 기복에만 쓴다. 파동까지 z로 보내면 배율이 액자 중심 기준으로 곱해져
  // 변위가 중심에서 멀수록 커진다 — 가운데를 누르면 대칭이라 돔으로 읽히지만
  // 옆을 누르면 마루 링이 한쪽으로만 밀려 실루엣 밖으로 튀어나온다.
  float z = (lum - 0.45) * uDepth * m;
  float persp = uFocal / max(1.0, uFocal - z);

  // 마루는 커지고 밝아진다 — 블룸 문턱을 넘어 물결이 빛 자국을 남긴다.
  float wave = clamp(lift, -1.2, 1.2);
  v_color = c * (1.0 + wave * 0.45);

  gl_Position = vec4((origin + rp * persp + push) / (uRes * 0.5), 0.0, 1.0);
  gl_PointSize = uSize * (1.0 + (1.0 - m) * 1.5) * persp * (1.0 + wave * 0.4);
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

type RenderInput = {
  morph: number;
  level: number;
  decay: number;
  /**
   * 음악 신호 채널. 전부 생략 가능하고 없으면 0 — 신호 없는 상태가 곧 기본값이다.
   * 필수로 두면 타입 검사가 닿지 않는 호출자(scripts/shoot-og.mjs가 문자열로 만드는 페이지)에서
   * undefined가 uniform에 들어가 NaN이 되고 파티클이 전부 사라진다.
   */
  /** 프레이즈 에너지(0–1). 블룸량과 휘도 깊이를 느리게 밀어올린다. */
  swell?: number;
  /** 피크 직전 들이쉼(0–1). 파티클이 수축한다. */
  pre?: number;
  /** 피크 직후 릴리스(0–1). 블룸 문턱이 낮아지고 점이 커진다. */
  hit?: number;
  /** 고역 = 하이햇·공기감(0–1). 블룸으로 번진다. 원곡 분석 신호가 없으면 0. */
  air?: number;
  /** RIPPLE_SLOTS × (x, y, 진행도, 진폭). 생략하면 파동 없음. */
  ripples?: Float32Array;
  /** RIPPLE_SLOTS × 시드. 파동마다 속도·폭을 달리해 같은 파동이 반복되지 않게 한다. */
  rippleSeeds?: Float32Array;
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
    'uPre',
    'uSize',
    'uSide',
    'uDepth',
    'uFocal',
    'uRipples[0]',
    'uRippleSeeds[0]',
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
  // 정점 셰이더가 저주파 휘도를 밉에서 읽는다. 밉이 없으면 텍스처가 불완전해져 검게 나온다.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  gl.generateMipmap(gl.TEXTURE_2D);

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
  // 마지막으로 실제로 그린 입력. 다음 입력과의 차이가 서브픽셀이면 그 프레임은 건너뛴다.
  let dirty = true;
  let drawnMorph = 0;
  let drawnLevel = 0;
  let hadRipple = false;
  let hadAccent = false;

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
    cssWidth = canvas.clientWidth;
    cssHeight = canvas.clientHeight;

    // 픽셀 예산을 넘는 화면에서는 dpr을 깎는다. 1 아래로는 안 내려간다 — 그 아래는 확대가 눈에 보인다.
    const area = Math.max(1, cssWidth * cssHeight);
    const wanted = Math.min(2, globalThis.devicePixelRatio || 1);
    dpr = Math.max(1, Math.min(wanted, Math.sqrt(MAX_DEVICE_PIXELS / area)));

    const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
    const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight || !accum) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      accum = [makeTarget(pixelWidth, pixelHeight), makeTarget(pixelWidth, pixelHeight)];
      bloom = [
        makeTarget(Math.max(1, pixelWidth >> BLOOM_SHIFT), Math.max(1, pixelHeight >> BLOOM_SHIFT)),
        makeTarget(Math.max(1, pixelWidth >> BLOOM_SHIFT), Math.max(1, pixelHeight >> BLOOM_SHIFT)),
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
    dirty = true;
  }

  function setArtwork(image: TexImageSource) {
    // 마지막 패스가 유닛 1을 잡아둔 채로 들어올 수 있다. 어느 유닛에 올릴지 명시한다.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, artwork);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    dirty = true;
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

  /**
   * 같은 그림을 다시 그리는 프레임은 버린다 — 파티클 8만 개 + 전면 4패스가 통째로 빠진다.
   * 기준은 "마지막으로 그린 프레임"이라, 조금씩 수렴하는 동안은 자동으로 프레임을 띄엄띄엄 그린다.
   * 감쇠가 살아 있으면 입력이 같아도 누적 버퍼가 계속 변하므로 그때는 건너뛰지 않는다.
   */
  function isRedundant(morph: number, level: number, decay: number, rippleAlive: boolean) {
    if (dirty || rippleAlive || hadRipple) return false;
    if (decay > STATIC_DECAY) return false;
    if (Math.abs(morph - drawnMorph) > MORPH_EPSILON) return false;
    return Math.abs(level - drawnLevel) <= LEVEL_EPSILON;
  }

  function render({ morph, level, decay, swell = 0, pre = 0, hit = 0, air = 0, ripples, rippleSeeds }: RenderInput) {
    if (!accum || !bloom || count === 0) return;

    let rippleAlive = false;
    if (ripples) {
      for (let i = 2; i < ripples.length; i += 4) {
        if ((ripples[i] ?? 1) < 1) rippleAlive = true;
      }
    }
    // 악센트가 살아 있으면 매 프레임 그린다 — 들이쉼·릴리스는 짧아서 건너뛰면 툭툭 끊긴다.
    // 끝난 직후 한 프레임도 그려야 수축·블룸이 화면에서 지워진다(hadRipple과 같은 이유).
    const accented = pre > 0 || hit > 0;
    // 연속 채널은 한 스칼라로 합쳐 문턱을 잡는다 — 어느 하나가 움직이면 그 프레임을 그린다.
    const continuous = level + swell + air;
    if (!accented && !hadAccent && isRedundant(morph, continuous, decay, rippleAlive)) return;
    dirty = false;
    drawnMorph = morph;
    drawnLevel = continuous;
    hadRipple = rippleAlive;
    hadAccent = accented;

    const source = accum[accumIndex];
    const destination = accum[accumIndex ^ 1];
    if (!source || !destination) return;
    const [bloomA, bloomB] = bloom;

    // 1) 이전 프레임을 감쇠시켜 옮긴다. 정지 상태면 그냥 지운다(선명하게 남는다).
    gl.disable(gl.BLEND);
    if (decay > STATIC_DECAY) {
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
    gl.uniform1f(points.uniforms.uPre ?? null, pre);
    gl.uniform1f(points.uniforms.uSize ?? null, Math.max(1.5, (side / grid) * dpr * 1.72) * (1 + hit * SIZE_PER_HIT));
    gl.uniform1f(points.uniforms.uDepth ?? null, side * (DEPTH_BASE + swell * DEPTH_PER_SWELL));
    gl.uniform1f(points.uniforms.uFocal ?? null, 1600);
    gl.uniform4fv(points.uniforms['uRipples[0]'] ?? null, ripples ?? IDLE_RIPPLES);
    gl.uniform1fv(points.uniforms['uRippleSeeds[0]'] ?? null, rippleSeeds ?? IDLE_SEEDS);
    gl.bindVertexArray(pointsVao);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.disable(gl.BLEND);

    // 3) 블룸 — 브라이트패스 후 가로·세로 블러
    quadPass(bloomA, bright, () => {
      bindTexture(0, destination.texture, bright.uniforms.uSrc ?? null);
      // 피크 직후엔 문턱을 낮춰 평소 안 새던 밝기까지 빛으로 끌어올린다.
      gl.uniform1f(bright.uniforms.uThreshold ?? null, BLOOM_THRESHOLD - hit * THRESHOLD_PER_HIT);
    });
    // uDir은 uv 단위다. 블룸 타깃 크기가 아니라 캔버스로 나눠 화면상 반경을 축소배율과 무관하게 고정한다.
    quadPass(bloomB, blur, () => {
      bindTexture(0, bloomA.texture, blur.uniforms.uSrc ?? null);
      gl.uniform2f(blur.uniforms.uDir ?? null, BLUR_PX / canvas.width, 0);
    });
    quadPass(bloomA, blur, () => {
      bindTexture(0, bloomB.texture, blur.uniforms.uSrc ?? null);
      gl.uniform2f(blur.uniforms.uDir ?? null, 0, BLUR_PX / canvas.height);
    });

    // 4) 합성 — 누적 버퍼는 빛만 담으므로 배경색을 여기서 더한다.
    quadPass(null, composite, () => {
      bindTexture(0, destination.texture, composite.uniforms.uScene ?? null);
      bindTexture(1, bloomA.texture, composite.uniforms.uBloom ?? null);
      gl.uniform3f(composite.uniforms.uBg ?? null, BACKGROUND[0], BACKGROUND[1], BACKGROUND[2]);
      gl.uniform1f(
        composite.uniforms.uBloomAmt ?? null,
        BLOOM_BASE + swell * BLOOM_PER_SWELL + hit * BLOOM_PER_HIT + air * BLOOM_PER_AIR,
      );
    });

    accumIndex ^= 1;
  }

  function dispose() {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  return { layout, setArtwork, render, dispose };
}
