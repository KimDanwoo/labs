/** Slow life across the whole sea, designed by Codex: a low swell of light, drifting cloud shadows and rings off the moored boat. */
export const SEA_ATMOSPHERE_GLSL = /* glsl */ `
  float seaHash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * .1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }

  float seaNoise(vec2 p) {
    vec2 cell = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6. - 15.) + 10.);
    return mix(
      mix(seaHash(cell), seaHash(cell + vec2(1., 0.)), u.x),
      mix(
        seaHash(cell + vec2(0., 1.)),
        seaHash(cell + vec2(1., 1.)),
        u.x
      ),
      u.y
    );
  }

  // Painting coordinates: x right, y down; both 0–1.
  float seaSwell(vec2 p, float t) {
    float depth = smoothstep(.13, .55, p.y);
    vec2 q = vec2(p.x * 7., p.y * 18.);
    float broad = seaNoise(q + vec2(t * .018, -t * .032));
    float detail = seaNoise(
      q * 1.73 + vec2(7.2 - t * .012, 2.8 - t * .022)
    );
    return ((broad - .5) * .13 + (detail - .5) * .045)
      * mix(.35, 1., depth);
  }

  float seaCloud(vec2 p, float t) {
    vec2 q = vec2(p.x * 3.2, p.y * 5.5)
      + vec2(-t * .012, t * .003);
    float body = seaNoise(q);
    float edge = seaNoise(q * 2.03 + vec2(11.7, 4.3));
    return smoothstep(.39, .74, body * .78 + edge * .22);
  }

  float seaBoatRing(vec2 p, float t, float offset, float aa) {
    float phase = fract(t / 6.8 + offset);
    float envelope = smoothstep(0., .18, phase)
      * (1. - smoothstep(.58, 1., phase));

    vec2 d = p - vec2(.581, .444);
    // Follow the original hull's upward slope to the right.
    d.y += d.x * .18;
    vec2 q = d / vec2(.058, .011);
    float radius = length(q);
    float target = .80 + phase * .85;

    float ring = 1. - smoothstep(
      .045, .045 + aa, abs(radius - target)
    );

    // Only the visible, near side of the boat.
    float nearSide = smoothstep(-.002, .006, d.y);
    float broken = smoothstep(
      .30, .65,
      seaNoise(vec2(p.x * 57., p.y * 39.) + offset * 13.)
    );

    return ring * envelope * nearSide * broken;
  }

  float seaBoatRipples(vec2 p, float t, float aa) {
    return min(
      1.,
      seaBoatRing(p, t, 0., aa)
      + seaBoatRing(p, t, .5, aa)
    );
  }
`;
