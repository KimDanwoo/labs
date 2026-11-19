import { RIPPLE_SLOTS } from '../../config/renderer';

const LUM = 'vec3(0.2126, 0.7152, 0.0722)';
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
export const VERT_POINTS = `#version 300 es
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
export const FRAG_POINTS = `#version 300 es
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
export const VERT_QUAD = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;
export const FRAG_FADE = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D uSrc;
uniform float uDecay;
out vec4 outColor;
void main() { outColor = vec4(texture(uSrc, v_uv).rgb * uDecay, 1.0); }`;
export const FRAG_BRIGHT = `#version 300 es
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
export const FRAG_BLUR = `#version 300 es
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
export const FRAG_COMPOSITE = `#version 300 es
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
