import { RIVER_GLSL } from '@shared/config';

// River and ocean use the same world-space waves so the estuary has no moving seam.
export const RIVER_VERTEX_SHADER = `
  uniform float uOcean;
  varying vec3 vWorldPos;
  varying float vViewDepth;
  ${RIVER_GLSL}
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    if (uOcean < 0.5) {
      world.x += riverOffset(world.z) + position.x * (riverWidth(world.z) - 1.0);
    }
    vWorldPos = world.xyz;
    vViewDepth = -(viewMatrix * world).z;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const RIVER_FRAGMENT_SHADER = `
  uniform float uTime, uOcean, uRunnerSplash;
  uniform vec3 uSkyTop, uSkyHorizon;
  uniform vec3 uSunDir, uDeepColor, uShallowColor, uHorizonColor, uRunnerPos;
  uniform vec2 uRunnerDir;
  uniform vec3 uSeaDeepColor, uSeaShallowColor, uSeaHorizonColor;
  uniform float uSeaFadeNear, uSeaFadeFar;
  uniform float uFadeNear, uFadeFar;
  varying vec3 vWorldPos;
  varying float vViewDepth;
  ${RIVER_GLSL}
  void main() {
    vec2 p = vWorldPos.xz;
    float coast = coastDistance(p);
    if ((uOcean < 0.5 && coast >= 0.0) || (uOcean > 0.5 && coast < 0.0)) discard;
    float depth = waterBedDepth(p) - RIVER_WATER_DROP;
    if (depth <= 0.002) discard;

    float sea = smoothstep(-120.0, 100.0, coast);
    // Analytic slopes: three wave derivatives, no repeated finite-difference samples.
    float a = p.y * 0.43 + p.x * 0.17 - uTime * 1.15;
    float b = p.y * 0.91 - p.x * 0.51 - uTime * 1.8;
    float c = p.y * 0.13 + p.x * 0.08 + uTime * 0.7;
    float damp = smoothstep(0.0, 0.4, depth) * (1.0 - smoothstep(150.0, 650.0, vViewDepth));
    vec2 slope = (vec2(0.17, 0.43) * cos(a) * 0.045
                + vec2(-0.51, 0.91) * cos(b) * 0.018
                + vec2(0.08, 0.13) * cos(c) * mix(0.04, 0.25, sea)) * damp;
    vec2 toRunner = p - uRunnerPos.xz;
    float behind = -dot(toRunner, uRunnerDir);
    float side = dot(toRunner, vec2(-uRunnerDir.y, uRunnerDir.x));
    float wake = exp(-abs(side) * 1.3 - abs(behind - 2.0) * 0.45) * smoothstep(0.0, 1.0, behind) * uRunnerSplash;
    slope += normalize(toRunner + vec2(0.001)) * sin(length(toRunner) * 5.0 - uTime * 7.0) * wake * 0.12;
    vec3 n = normalize(vec3(-slope.x, 1.0, -slope.y));
    vec3 toCam = normalize(cameraPosition - vWorldPos);
    float depthT = 1.0 - exp(-depth * 0.65);
    float estuary = smoothstep(-160.0, 0.0, coast);
    vec3 horizon = mix(uHorizonColor, uSeaHorizonColor, estuary);
    vec3 shallow = mix(uShallowColor, uSeaShallowColor, estuary);
    vec3 deep = mix(uDeepColor, uSeaDeepColor, estuary);
    vec3 col = mix(shallow, deep, depthT);
    float alpha = mix(0.2, 0.94, depthT);
    float fresnel = 0.035 + 0.65 * pow(1.0 - max(dot(n, toCam), 0.0), 5.0);
    vec3 refl = reflect(-toCam, n);
    refl.y = abs(refl.y);
    // Match the visible sky gradient instead of magnifying the low-resolution environment cubemap.
    vec3 sky = mix(uSkyHorizon, uSkyTop, pow(smoothstep(0.0, 0.45, refl.y), 0.65));
    float rippleDetail = (1.0 - smoothstep(50.0, 220.0, vViewDepth)) * sin(a + sin(b) * 0.35) * sin(b);
    col *= 1.0 + rippleDetail * 0.035;
    col = mix(col, sky, fresnel);
    alpha = mix(alpha, 1.0, fresnel);
    float glint = pow(max(dot(refl, uSunDir), 0.0), 90.0);
    col += vec3(1.0, 0.94, 0.77) * glint * 0.35;

    // Broken foam follows shallow shore contours; no uniform white outline.
    float shore = (1.0 - smoothstep(0.03, mix(0.16, 0.32, sea), depth));
    float foamWave = sin(coast * 0.65 + uTime * 1.4 + sin(p.x * 0.18));
    float foam = shore * smoothstep(0.25, 0.85, foamWave) * mix(0.12, 0.65, sea);
    col = mix(col, vec3(0.78, 0.85, 0.75), foam + wake * 0.13);
    alpha = max(alpha * smoothstep(0.0, 0.07, depth), foam);
    float fade = smoothstep(mix(uFadeNear, uSeaFadeNear, estuary), mix(uFadeFar, uSeaFadeFar, estuary), vViewDepth);
    gl_FragColor = vec4(mix(col, horizon, fade), mix(alpha, 1.0, fade));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const RIVER_BED_VERTEX_SHADER = `
  varying vec2 vWorldXZ;
  varying float vViewDepth;
  ${RIVER_GLSL}
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    world.x += riverOffset(world.z) + position.x * (riverWidth(world.z) - 1.0);
    world.y -= waterBedDepth(world.xz);
    vWorldXZ = world.xz;
    vViewDepth = -(viewMatrix * world).z;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const RIVER_BED_FRAGMENT_SHADER = `
  uniform float uTime, uPebbleScale, uBankBlend, uFadeNear, uFadeFar;
  uniform vec3 uPebbleDark, uPebbleLight, uGrassColor, uHorizonColor;
  varying vec2 vWorldXZ;
  varying float vViewDepth;
  ${RIVER_GLSL}
  vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
  }
  void main() {
    if (coastDistance(vWorldXZ) >= 0.0) discard;
    float dist = riverDist(vWorldXZ);
    float bed = waterBedDepth(vWorldXZ);
    float waterDepth = bed - RIVER_WATER_DROP;
    float gravelPatch = 0.5 + 0.5 * sin(vWorldXZ.x * 0.19 + sin(vWorldXZ.y * 0.14)) * sin(vWorldXZ.y * 0.27);
    vec3 col = mix(uPebbleDark, uPebbleLight, 0.6 + gravelPatch * 0.15);
    float detail = 1.0 - smoothstep(28.0, 80.0, distance(cameraPosition.xz, vWorldXZ));
    // The expensive pebble pattern is needed only in nearby gravelPatches of gravel.
    if (detail > 0.01 && gravelPatch > 0.42) {
      vec2 p = vWorldXZ * uPebbleScale;
      vec2 base = floor(p);
      float nearest = 10.0;
      vec2 nearestCell = base;
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec2 cell = base + vec2(float(i), float(j));
          vec2 delta = p - (cell + 0.25 + hash2(cell) * 0.5);
          float d = dot(delta, delta);
          if (d < nearest) { nearest = d; nearestCell = cell; }
        }
      }
      float stoneSize = 0.04 + hash2(nearestCell + 3.0).y * 0.06;
      float stone = 1.0 - smoothstep(stoneSize * 0.65, stoneSize, nearest);
      vec3 gravel = mix(uPebbleDark, uPebbleLight, 0.25 + hash2(nearestCell + 7.0).x * 0.45);
      gravel *= mix(0.86, 1.03, 1.0 - smoothstep(0.0, stoneSize, nearest));
      col = mix(col, gravel, stone * detail * smoothstep(0.42, 0.65, gravelPatch));
    }
    col *= mix(1.0, 0.72, 1.0 - smoothstep(-0.25, 0.15, -waterDepth));
    float caustic = pow(max(sin(vWorldXZ.x * 2.1 + uTime) * sin(vWorldXZ.y * 1.7 - uTime * 0.8), 0.0), 4.0);
    col += vec3(0.07, 0.08, 0.05) * caustic * step(0.0, waterDepth) * detail;
    float bank = smoothstep(RIVER_TRENCH_HALF - uBankBlend, RIVER_TRENCH_HALF, dist + (gravelPatch - 0.5) * 1.5);
    col = mix(col, uGrassColor * (0.94 + gravelPatch * 0.06), bank);
    float fade = smoothstep(uFadeNear, uFadeFar, vViewDepth);
    gl_FragColor = vec4(mix(col, uHorizonColor, fade), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
