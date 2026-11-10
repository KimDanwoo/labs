import { BREEZE_GLSL } from './breeze';
import { FAN_GLSL } from './fan';
import { HOME_WEATHER_GLSL } from './homeWeather';
import { MAX_LAMPS } from './nightLights';
import { SEA_ATMOSPHERE_GLSL } from './seaAtmosphere';

export const BACKGROUND_VERTEX =
  'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';

export const BACKGROUND_FRAGMENT = `varying vec2 vUv; uniform sampler2D map; uniform float time; uniform float evening; uniform float night; uniform float rain; uniform float fade;
  uniform vec3 lamps[${MAX_LAMPS}]; uniform int lampCount; uniform vec2 walker; uniform sampler2D waterMap; uniform sampler2D foam; uniform sampler2D glitter; uniform float isSea; uniform float isVillage; uniform float isHome;
  ${BREEZE_GLSL}
  ${FAN_GLSL}
  ${HOME_WEATHER_GLSL}
  // Sun glitter on the sea (designed by Codex): painted glints, each fading in and out on its own beat.
  ${SEA_ATMOSPHERE_GLSL}
  // The painted sea itself sways and rolls shoreward, and the moored boat bobs with it (designed by Codex).
  uniform float renderDpr;

  const float SEA_TAU = 6.28318530718;
  const vec2 BOAT_PIVOT = vec2(.581, .430);

  vec2 seaPainting(vec2 uv) {
    return vec2(uv.x, 1. - uv.y);
  }

  vec2 seaUv(vec2 painting) {
    return vec2(painting.x, 1. - painting.y);
  }

  // Log perspective: the same phase shift reads smaller and slower far away.
  float seaDepthCoordinate(float y) {
    return log(1. + max(y - .12, 0.) * 8.);
  }

  float seaWavePhase(vec2 p, float t) {
    float distanceFromBoat =
      (seaDepthCoordinate(p.y) -
       seaDepthCoordinate(BOAT_PIVOT.y)) * 4.0 +
      (p.x - BOAT_PIVOT.x) * .6;
    return SEA_TAU * t / 7.2 - distanceFromBoat;
  }

  float seaMotionStart(float t) {
    return smoothstep(0., 2., max(t, 0.));
  }

  // Crossing swells build uneven sets, with sharper crests and broad troughs.
  float seaCarrier(vec2 p, float t) {
    float phase = seaWavePhase(p, t);
    float crossing = seaDepthCoordinate(p.y) * 13. + p.x * 9. - t * 1.17;
    float set = .82 + .18 * sin(t * .19 + p.x * 3.);
    return (sin(phase) * .68 + sin(phase * 2. + .6) * .12
      + sin(crossing) * .20) * set * seaMotionStart(t);
  }

  // Short wind ripples share the shoreward flow without marching in straight lines.
  float seaRipple(vec2 p, float t) {
    float depth = seaDepthCoordinate(p.y);
    float bend = sin(p.x * 19. + depth * 3. - t * .31);
    float phase = depth * 58. + p.x * 13. + bend * 1.4 - t * 2.7;
    float secondary = depth * 93. - p.x * 31. - t * 3.6;
    float aa = 1. - smoothstep(.6, 2.5, fwidth(phase));
    return (sin(phase) * .7 + sin(secondary) * .3) * aa;
  }

  // Two low-frequency noises, no texture samples.
  vec2 seaBodyNoise(vec2 p, float t) {
    vec2 q = vec2(p.x * 6., seaDepthCoordinate(p.y) * 6.);
    return vec2(
      seaNoise(q + vec2(-t * .024, -t * .14)),
      seaNoise(q * vec2(.79, 1.13) +
        vec2(8.7 + t * .018, 3.2 - t * .12))
    );
  }

  float seaSegmentDistance(vec2 p, vec2 a, vec2 b) {
    vec2 d = b - a;
    float h = clamp(dot(p - a, d) / max(dot(d, d), 1e-8), 0., 1.);
    return length(p - a - d * h);
  }

  void seaBoatEdge(
    vec2 p, vec2 a, vec2 b,
    inout float distanceToEdge, inout float inside
  ) {
    distanceToEdge = min(distanceToEdge, seaSegmentDistance(p, a, b));
    if ((a.y > p.y) != (b.y > p.y)) {
      float crossingX = a.x + (p.y - a.y) * (b.x - a.x) / (b.y - a.y);
      if (p.x < crossingX) inside = 1. - inside;
    }
  }

  float seaBoatPatch(vec2 p) {
    float d = 1.;
    float inside = 0.;

    seaBoatEdge(p, vec2(.523,.406), vec2(.548,.411), d, inside);
    seaBoatEdge(p, vec2(.548,.411), vec2(.562,.409), d, inside);
    seaBoatEdge(p, vec2(.562,.409), vec2(.562,.396), d, inside);
    seaBoatEdge(p, vec2(.562,.396), vec2(.570,.391), d, inside);
    seaBoatEdge(p, vec2(.570,.391), vec2(.592,.392), d, inside);
    seaBoatEdge(p, vec2(.592,.392), vec2(.598,.399), d, inside);
    seaBoatEdge(p, vec2(.598,.399), vec2(.599,.407), d, inside);
    seaBoatEdge(p, vec2(.599,.407), vec2(.627,.398), d, inside);
    seaBoatEdge(p, vec2(.627,.398), vec2(.635,.398), d, inside);
    seaBoatEdge(p, vec2(.635,.398), vec2(.635,.414), d, inside);
    seaBoatEdge(p, vec2(.635,.414), vec2(.627,.429), d, inside);
    seaBoatEdge(p, vec2(.627,.429), vec2(.605,.441), d, inside);
    seaBoatEdge(p, vec2(.605,.441), vec2(.573,.451), d, inside);
    seaBoatEdge(p, vec2(.573,.451), vec2(.545,.452), d, inside);
    seaBoatEdge(p, vec2(.545,.452), vec2(.535,.443), d, inside);
    seaBoatEdge(p, vec2(.535,.443), vec2(.528,.425), d, inside);
    seaBoatEdge(p, vec2(.528,.425), vec2(.523,.406), d, inside);

    // The hull moves rigidly; only the water around it eases out.
    float hull = 1. - smoothstep(.003, .012, mix(d, -d, inside));

    vec2 reflection = p - vec2(.581, .459);
    reflection.y += reflection.x * .18;
    float reflectedPatch = 1. - smoothstep(
      .65, 1., length(reflection / vec2(.068, .024))
    );

    // The mast, traced by eye from the painting.
    float mast = 1. - smoothstep(
      .002, .005,
      seaSegmentDistance(p, vec2(.594, .350), vec2(.594, .408))
    );

    return max(hull, max(reflectedPatch, mast));
  }

  // Inverse map from where a pixel is drawn to where it is read from the painting;
  // rotation works in CSS pixels so the aspect ratio cannot skew it.
  vec2 seaBoatSource(vec2 p, vec2 cssPixel, float t) {
    vec2 localPx = (p - BOAT_PIVOT) / cssPixel;
    float phase = seaWavePhase(BOAT_PIVOT, t);
    float start = seaMotionStart(t);

    float heavePx = (sin(phase) * 2.8 + sin(phase * 1.71) * .55) * start;
    float halfHullPx = max(.056 / cssPixel.x, 1.);
    float angle = (cos(phase) * 1.35 + sin(phase * .73) * .35) * start / halfHullPx;

    localPx -= vec2(sin(phase * .65) * .65 * start, heavePx);
    float cs = cos(angle);
    float sn = sin(angle);
    vec2 sourcePx = vec2(
      cs * localPx.x + sn * localPx.y,
      -sn * localPx.x + cs * localPx.y
    );
    return BOAT_PIVOT + sourcePx * cssPixel;
  }
  vec3 glitterHash(vec2 p) {
    vec3 h = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    h += dot(h, h.yxz + 33.33);
    return fract((h.xxy + h.yzz) * h.zyx);
  }

  float glitterLayer(vec2 painting, float seed) {
    vec2 p = painting + vec2(seed * .0031, seed * .0017);

    // Rows increase in height toward the viewer.
    // Each row also increases horizontal spacing by the same ratio.
    const float growth = .018;
    const float farHeight = .004;
    float depth = max(p.y - .12, 0.);
    float rowCoord =
      log(1. + depth * growth / farHeight) / log(1. + growth);
    float row = floor(rowCoord);
    float rowScale = pow(1. + growth, row);
    float rowStart = farHeight * (rowScale - 1.) / growth;
    float cellHeight = farHeight * rowScale;
    float cellWidth = .009 * rowScale;

    float rowShift = glitterHash(vec2(row, seed + 41.)).x;
    float columnCoord = p.x / cellWidth + rowShift;
    vec2 id = vec2(floor(columnCoord), row);
    vec2 local = vec2(
      fract(columnCoord),
      (depth - rowStart) / cellHeight
    );

    vec3 rnd = glitterHash(id + vec2(seed * 71., seed * 19.));
    vec3 groupRnd = glitterHash(floor(id / vec2(4., 3.)) + seed * 37.);

    float period = mix(1.1, 3.2, rnd.y);
    float phase = fract(time / period + rnd.x);
    float pulse =
      smoothstep(.06, .24, phase) *
      (1. - smoothstep(.38, .76, phase));

    float groupPhase = fract(time / 8.7 + groupRnd.x);
    float groupPulse =
      smoothstep(.0, .30, groupPhase) *
      (1. - smoothstep(.50, 1., groupPhase));
    float groupGain = mix(.18, 1., groupPulse);

    float depthMix = smoothstep(.14, .53, painting.y);
    float keep = 1. - step(mix(.67, .58, depthMix), rnd.z);

    // The motif stays within its cell, including drift and jitter.
    // Phase resets only while the motif is invisible.
    vec2 jitter = (rnd.xy - .5) * .68;
    vec2 drift = vec2(.10, .055) * (phase - .4);
    vec2 stamp = local - jitter - drift;
    if (rnd.z > .5) stamp.x = 1. - stamp.x;

    float inside =
      step(0., stamp.x) * step(stamp.x, 1.) *
      step(0., stamp.y) * step(stamp.y, 1.);

    float motif = floor(
      glitterHash(id + vec2(93., seed * 53.)).x * 16.
    );
    vec2 tile = vec2(mod(motif, 4.), floor(motif / 4.));

    // Image coordinates run downward; texture UVs run upward.
    vec2 atlasUv =
      (tile + clamp(stamp, vec2(.002), vec2(.998))) / 4.;
    atlasUv.y = 1. - atlasUv.y;

    float ink = texture2D(glitter, atlasUv).r;
    vec2 facet = stamp - .5;
    float aa = max(fwidth(painting.y) / cellHeight, .025);
    float width = mix(.10, .34, rnd.x);
    float glint = (1. - smoothstep(width * .55, width, abs(facet.x))) *
      (1. - smoothstep(.025, .065 + aa, abs(facet.y + sin(facet.x * 14. + rnd.y * 7.) * .035)));
    float pixelsAcross = cellWidth / max(fwidth(painting.x), .000001);
    float resolved = smoothstep(1., 3., pixelsAcross);
    return max(ink * .45, glint) * inside * keep * pulse * pulse * groupGain *
      mix(.8, 1.4, rnd.y) * resolved;
  }
  void main(){
    vec2 uv=sceneryUv(vUv);
    // Rivers carry broken foam downstream and spray off the rocks (designed by Codex); the sea's waves are
    // painted sprites (see waves.ts).
    const float W_TAU = 6.28318530718;

    vec4 water = texture2D(waterMap, vUv);                  // 1

    float nearWater = 1. - vUv.y;
    float wt = time * (1. + rain * .20);
    vec2 p = vec2(vUv.x * 1.5, nearWater);

    float wet = smoothstep(.12, .78, water.r);
    vec2 flow = (water.gb * 255. - 128.) / 127.;
    float pace = length(flow);
    float speed = clamp(pace, 0., 1.);
    float river = smoothstep(.025, .12, pace);

    vec2 riverDir = vec2(0., 1.);
    if (pace > .025) {
      riverDir = normalize(flow * vec2(1.5, 1.));
    }


    // Fixed texture coordinates; the flow field only offsets the lookup.
    float velocity = .012 + .027 * speed;
    float phaseA = fract(wt / 4.8);
    float phaseB = fract(phaseA + .5);
    float weightA = .5 - .5 * cos(W_TAU * phaseA);
    vec2 backA = p - riverDir * velocity * (phaseA * 4.8);
    vec2 backB = p - riverDir * velocity * (phaseB * 4.8);

    // The supplied image already contains elongated lace.
    // Keep individual holes visible instead of shrinking them into lines.
    vec2 foamScale = vec2(13., 4.5);
    float foamA = texture2D(
      foam, backA * foamScale + vec2(.17, .31)
    ).r;                                                     // 3
    float foamB = texture2D(
      foam, backB * foamScale + vec2(.17, .31)
    ).r;                                                     // 4

    float lace = mix(
      smoothstep(.20, .72, foamB),
      smoothstep(.20, .72, foamA),
      weightA
    );
    float tips = mix(
      smoothstep(.58, .92, foamB),
      smoothstep(.58, .92, foamA),
      weightA
    );

    // A separate, broad mask breaks up the foam coverage.
    float patchMask = texture2D(
      foam, p * vec2(2.1, 2.7) + vec2(-wt * .0015, .43)
    ).r;                                                     // 5
    float islands = smoothstep(.22, .68, patchMask);

    // Derivatives outside any branch; one framebuffer pixel converted to one CSS pixel.
    vec2 seaCssPixel = max(
      vec2(length(vec2(dFdx(vUv.x), dFdy(vUv.x))),
           length(vec2(dFdx(vUv.y), dFdy(vUv.y)))) *
        max(renderDpr, .001),
      vec2(1e-7)
    );

    vec2 seaOutputPainting = seaPainting(vUv);
    vec2 seaSourcePainting = seaOutputPainting;
    vec2 seaNoiseDelta = vec2(0.);
    float seaBoatWeight = 0.;

    uv = mix(uv, vUv, wet);
    float riceBend = 0.;
    if (isVillage > .5) {
      vec3 stalk = texture2D(map, vUv).rgb;
      float green = smoothstep(.025, .13, stalk.g - max(stalk.r * .85, stalk.b));
      float paddy = smoothstep(.90, .999, water.r) * (1. - river) * green;
      float gust = .55 + .45 * sin(time * .43 - vUv.x * 8.);
      riceBend = sin(vUv.x * 39. + vUv.y * 17. - time * 1.55) * gust * paddy;
      uv.x += riceBend * .0016;
      uv.y += riceBend * .00035;
    }

    if (isSea > .5) {
      seaBoatWeight = seaBoatPatch(seaOutputPainting);

      // The water map has a hole where the boat is, so the boat's own motion is not masked by it.
      vec2 rigidBoatSource = seaBoatSource(
        seaOutputPainting, seaCssPixel, time
      );
      vec2 boatSource = mix(
        seaOutputPainting, rigidBoatSource, seaBoatWeight
      );

      // Extra water-map sample 1: keep the mask with the moved boat.
      vec4 boatWater = texture2D(waterMap, seaUv(boatSource));

      float depth = smoothstep(.13, .55, seaOutputPainting.y);
      seaNoiseDelta =
        seaBodyNoise(seaOutputPainting, time) -
        seaBodyNoise(seaOutputPainting, 0.);

      float carrier = seaCarrier(seaOutputPainting, time);
      float amplitudePx = mix(1.0, 8.0, depth) *
        mix(1., 1.12, clamp(rain, 0., 1.));

      vec2 displacementPx = amplitudePx * vec2(
        .30 * seaNoiseDelta.x + .22 * carrier,
        .28 * seaNoiseDelta.y + .65 * carrier
      );

      // Inside the boat patch the painting moves rigidly; only the open sea sways.
      float sourceGate =
        smoothstep(.94, .999, boatWater.r) *
        (1. - river) *
        (1. - seaBoatWeight);

      // Reading backwards: a positive on-screen shift samples the painting the other way.
      vec2 candidate =
        boatSource - displacementPx * seaCssPixel * sourceGate;
      vec2 candidateUv = seaUv(candidate);

      // Extra water-map sample 2: the shifted read must still be open water, or it is cancelled.
      vec4 candidateWater = texture2D(waterMap, candidateUv);

      float inBounds =
        step(0., candidateUv.x) * step(candidateUv.x, 1.) *
        step(0., candidateUv.y) * step(candidateUv.y, 1.);

      float destinationSafe =
        inBounds * step(.94, candidateWater.r);

      seaSourcePainting = mix(boatSource, candidate, destinationSafe);
      water = mix(boatWater, candidateWater, destinationSafe);
      wet = smoothstep(.12, .78, water.r);

      uv = seaUv(seaSourcePainting);
    }

    vec4 tex = texture2D(map, uv);

    float waterColour =
      smoothstep(.008, .080, max(tex.g, tex.b) - tex.r) *
      smoothstep(.70, .98, tex.b / max(tex.g, .001));
    float waterEffect = wet * waterColour;
    vec2 glitterPainting = mix(
      vec2(vUv.x, nearWater),
      seaSourcePainting,
      step(.5, isSea)
    );
    // Keep low-frequency body motion separate from painted bright foam.
    float seaBodyMask =
      isSea *
      smoothstep(.80, .995, water.r) *
      (1. - river) *
      mix(.65, 1., waterColour);

    float seaSwellValue = 0.;
    float seaCloudValue = 0.;
    float seaBoatValue = 0.;

    float seaBoatAA = max(
      length(fwidth(glitterPainting) / vec2(.058, .011)) * 1.2,
      .018
    );

    if (isSea > .5) {
      float swellDepth = smoothstep(.13, .55, seaOutputPainting.y);

      seaSwellValue =
        (
          .16 * seaCarrier(seaOutputPainting, time) +
          .035 * seaRipple(seaOutputPainting, time) +
          .035 * seaNoiseDelta.y
        ) * mix(.35, 1., swellDepth);

      // Cloud shadows stay put on the world.
      seaCloudValue = seaCloud(seaOutputPainting, time);

      // Hull rings follow the boat's 7.2 s bob,
      // and move with it.
      seaBoatValue = seaBoatRipples(
        seaSourcePainting,
        time * (6.8 / 7.2),
        seaBoatAA
      );
    }

    // Clouds lose their distinct shadows under overcast skies.
    float seaCloudShade =
      seaCloudValue *
      (1. - night) *
      (1. - rain) * (1. - rain) *
      mix(1., .7, evening);

    // Exactly two additional texture samples.
    float glitterFine = glitterLayer(glitterPainting, 0.);
    float glitterScatter = glitterLayer(glitterPainting, 1.);

    float glitterDepth = clamp((nearWater - .14) / .38, 0., 1.);
    float glitterExtent =
      smoothstep(.125, .16, nearWater) *
      (1. - smoothstep(.49, .555, nearWater));

    float sunCentre = mix(.66, .78, glitterDepth);
    float sunWidth = mix(.07, .19, glitterDepth);
    float sunBand = 1. - smoothstep(
      sunWidth * .18, sunWidth, abs(vUv.x - sunCentre)
    );

    float seaMoonCentre = mix(.88, .81, glitterDepth);
    float seaMoonWidth = mix(.02, .05, glitterDepth);
    float seaMoonBand = 1. - smoothstep(
      seaMoonWidth * .15,
      seaMoonWidth,
      abs(vUv.x - seaMoonCentre)
    );

    float seaMask =
      isSea *
      smoothstep(.72, .98, water.r) *
      (1. - river) *
      mix(.30, 1., waterColour);

    float glitterClear = pow(1. - clamp(rain, 0., 1.), 3.);
    float glitterAmount =
      seaMask * glitterExtent * glitterClear *
      min(1., glitterFine + glitterScatter * .55);
    if (isSea > .5) {
      // Reflections catch the moving faces of the waves.
      glitterAmount *= .65 + .35 * smoothstep(
        -.4, .65, seaRipple(seaOutputPainting, time)
      );
    }

    // Do not repeatedly bleach the highlights already painted into the sea.
    float paintedBright = max(tex.r, max(tex.g, tex.b));
    glitterAmount *= mix(
      1., .40, smoothstep(.65, .95, paintedBright)
    );

    vec3 glitterDayColour = mix(
      vec3(1., .94, .77),
      vec3(1., .57, .20),
      evening
    );
    vec3 glitterLight = mix(
      glitterDayColour * (.08 + sunBand * 1.8),
      vec3(.40, .59, .86) * (.06 + seaMoonBand * .65),
      night
    );

    // Fixed-distance probes avoid the old resetting wake sweep.
    vec2 riverUv = vec2(riverDir.x / 1.5, -riverDir.y);
    vec2 nearUv = clamp(
      vUv - riverUv * .0035, vec2(.001), vec2(.999)
    );
    vec2 farUv = clamp(
      vUv - riverUv * (.010 + .010 * speed),
      vec2(.001), vec2(.999)
    );
    vec3 nearTex = texture2D(map, nearUv).rgb;                 // 7
    vec3 farTex = texture2D(map, farUv).rgb;                   // 8

    float nearColour =
      smoothstep(.008, .080, max(nearTex.g, nearTex.b) - nearTex.r) *
      smoothstep(.70, .98, nearTex.b / max(nearTex.g, .001));
    float farColour =
      smoothstep(.008, .080, max(farTex.g, farTex.b) - farTex.r) *
      smoothstep(.70, .98, farTex.b / max(farTex.g, .001));

    float contact = (1. - nearColour) * waterColour;
    float wake = (1. - farColour) * waterColour;

    // Broad, intermittent foam fragments travelling down the river.
    float riverSurface = river * lace * islands * (.035 + .065 * speed);
    float riverSpray = river * (
      contact * (.24 + .64 * lace) +
      wake * lace * (.15 + .30 * islands)
    ) * (.65 + .55 * speed);


    // Rain changes existing irregular shapes instead of adding scanlines.
    float rainTexture =
      rain * tips * islands * .045 * river;

    float waterHighlights = waterEffect * (
      riverSurface +
      rainTexture
    );

    float waterFoam = clamp(waterEffect * riverSpray * (1. + rain * .20), 0., .88);

    vec3 c = fanSurface(tex.rgb, vUv) * (1. + riceBend * .045) * sceneryLight(vUv);
    // The painted glints brighten and dim as the surface moves.
    if (isSea > .5) {
      float brightPaint = smoothstep(
        .58, .90, max(tex.r, max(tex.g, tex.b))
      );

      float waterOnly =
        smoothstep(.94, .999, water.r) *
        (1. - river) *
        (1. - seaBoatWeight);

                // Exactly zero at time 0; no texture samples.
      float paintedTwinkle =
        seaNoise(
          seaSourcePainting * vec2(31., 53.) +
          vec2(time * .13, -time * .19)
        ) -
        seaNoise(seaSourcePainting * vec2(31., 53.));

      float paintedTwinkleGain =
        .40 *
        mix(1., .45, clamp(night, 0., 1.)) *
        mix(1., .20, clamp(rain, 0., 1.));

      c *= 1. +
        waterOnly * brightPaint * paintedTwinkle * paintedTwinkleGain;
    }

    // 1. Broad changes in reflected light, before time-of-day grading.
    // Preserve contrast in the foam already painted into the image.
    float seaPaintHighlight = smoothstep(
      .55, .92, max(tex.r, max(tex.g, tex.b))
    );
    float seaBodyGain =
      seaBodyMask *
      mix(1., .4, seaPaintHighlight) *
      mix(1., .55, night) *
      mix(1., .65, rain);

    c *= 1. + seaSwellValue * seaBodyGain;

    // 2. Soft cloud shadows: subtle cooling, no white overlay.
    c *= vec3(1.) -
      vec3(.13, .10, .055) * seaCloudShade * seaBodyMask;
    vec3 warm=c*vec3(1.09,.79,.67)+vec3(.025,.005,.018);
    c=mix(c,warm,evening*.65);
    // Linear light: these factors read about twice as bright once converted for the screen.
    vec3 base=c;
    vec3 grey=vec3(dot(c,vec3(.3,.59,.11)));
    vec3 moonlit=mix(c,grey,.45)*vec3(.09,.12,.24)+vec3(.0,.003,.015);
    c=mix(c,moonlit,night*.9);
    // After dark, windows, lanterns and the walker's glow give the painting back its colour in warm pools.
    float pool=0.;
    for(int i=0;i<${MAX_LAMPS};i++){
      if(i>=lampCount) break;
      vec2 d=(uv-lamps[i].xy)*vec2(1.5,1.);
      pool+=1.-smoothstep(0.,lamps[i].z*2.2,length(d));
    }
    float carry=1.-smoothstep(0.,.13,length((uv-walker)*vec2(1.5,1.)));
    vec3 lamplit=base*vec3(1.05,.84,.58);
    c=mix(c,lamplit,clamp(pool*.85+carry*.35,0.,.9)*night);
    // Highlights and foam take the light of the hour: paint-white by day, moon and lamps by night.
    float moonCentre = .64 + .018 * sin(vUv.y * 17.);
    float moonWidth = mix(.035, .15, nearWater);
    float moon = 1. - smoothstep(
      moonWidth * .25, moonWidth, abs(vUv.x - moonCentre)
    );
    moon *= smoothstep(.06, .22, vUv.y) *
            (1. - smoothstep(.86, .98, vUv.y));

    float lampLight = clamp(pool * .65, 0., 1.);
    float moonLight = moon * (1. - rain * .85);

    vec3 daylightColour = mix(
      vec3(.78, .91, .96),
      vec3(1., .79, .53),
      evening * .65
    );
    vec3 reflectedLight = mix(
      daylightColour * (.42 * (1. - rain * .20)),
      vec3(.40, .58, .90) * moonLight * .075 +
        vec3(1., .76, .43) * lampLight * .35,
      night
    );
    c += waterHighlights * reflectedLight;

    vec3 foamDay = mix(
      vec3(.84, .90, .86),
      vec3(.94, .78, .57),
      evening * .55
    );
    vec3 foamNight =
      vec3(.004, .008, .015) +
      vec3(.40, .58, .86) * moonLight * .095 +
      vec3(1., .76, .44) * lampLight * .42;
    vec3 foamColour = mix(foamDay, foamNight, night);
    c = mix(c, foamColour, waterFoam);
    // The same cloud field dims the sun glitter.
    float seaSunVisibility =
      1. - seaCloudShade * seaBodyMask * .78;

    c += glitterAmount * glitterLight * seaSunVisibility *
      (vec3(1.) - clamp(c, 0., 1.));

    // 3. Short, broken ripples on the visible side of the hull.
    // foamColour already follows evening, night and nearby lights.
    float seaHullRippleAmount =
      seaBoatValue *
      seaBodyMask *
      .085 *
      mix(1., .55, rain) *
      (1. - seaCloudShade * .45);

    c = mix(c, foamColour, seaHullRippleAmount);
    float edge=1.-smoothstep(.3,.95,length((uv-vec2(.5,.45))*vec2(1.1,1.35)));
    c*=mix(1.,.55+.45*edge,night);
    vec3 overcast=mix(c,vec3(dot(c,vec3(.3,.59,.11))),.5)*vec3(.6,.66,.72);
    c=mix(c,overcast,rain*.8);
    c=homeWeather(c,vUv);
    gl_FragColor=vec4(c*fade,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
