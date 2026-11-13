export const FAN_GLSL = `
  float fanRotor(vec2 q, float phase) {
    float radius = length(q);
    float angle = atan(q.y,q.x) - phase + radius*.52;
    float blade = smoothstep(.12,.72,cos(angle*3.));
    return blade * smoothstep(.18,.34,radius) * (1.-smoothstep(.73,.91,radius));
  }
  vec3 homeFan(vec3 painting, vec2 uv) {
    // Measured against the painting: the hub is (802,500), not the old off-centre pivot.
    vec2 pixel = vec2(uv.x,1.-uv.y)*vec2(1536.,1024.);
    vec2 q = (pixel-vec2(802.,500.))/vec2(27.,27.);
    float radius=length(q);
    if (radius>.99 || radius<.24) return painting;
    float aa=max(fwidth(radius),.015);
    float angle=atan(q.y,q.x);
    // Integrate a short exposure: blades read as a soft continuous rotation at 30 fps.
    float phase=sceneryTime*18.;
    float rotor=(fanRotor(q,phase)*.32 + fanRotor(q,phase-.24)*.28
      + fanRotor(q,phase-.48)*.23 + fanRotor(q,phase-.72)*.17);
    vec3 rear=mix(vec3(.17,.115,.065),vec3(.09,.10,.075),smoothstep(-.8,.9,q.y));
    vec3 spinning=mix(rear,vec3(.055,.13,.125),rotor*.78);
    // These wires never rotate. The original outer rim and centre badge remain untouched.
    float spokes=abs(sin(angle*12.))*radius;
    float wire=1.-smoothstep(.010,.010+aa,spokes);
    float rings=abs(fract(radius*4.2+.15)-.5)/4.2;
    wire=max(wire,(1.-smoothstep(.006,.006+aa*.6,rings))*.72);
    float gleam=.42+.30*(1.-q.y);
    vec3 guard=mix(vec3(.055,.073,.062),vec3(.24,.25,.19),gleam);
    spinning=mix(spinning,guard,wire*.80);
    float interior=smoothstep(.24,.31,radius)*(1.-smoothstep(.90,.99,radius));
    return mix(painting,spinning,interior*.94);
  }
  const vec2 CLASSROOM_FAN_HUB = vec2(293.,471.);
  const vec2 CLASSROOM_FAN_RADIUS = vec2(39.,41.);
  const int FAN_SWEEP_SAMPLES = 8;
  vec3 classroomFan(vec3 painting, vec2 uv) {
    vec2 pixel = vec2(uv.x,1.-uv.y)*vec2(1536.,1024.);
    vec2 q = (pixel-CLASSROOM_FAN_HUB)/CLASSROOM_FAN_RADIUS;
    float radius = length(q);
    if (radius>.92 || radius<.2) return painting;
    float angle = atan(q.y,q.x);
    vec3 disc = vec3(0.);
    // One blade passes every third of a turn, so averaging that sweep erases the still blades.
    for (int k=0; k<FAN_SWEEP_SAMPLES; k++) {
      float a = angle + float(k)*(2.0944/float(FAN_SWEEP_SAMPLES));
      vec2 source = CLASSROOM_FAN_HUB + vec2(cos(a),sin(a))*radius*CLASSROOM_FAN_RADIUS;
      disc += texture2D(map, vec2(source.x/1536., 1.-source.y/1024.)).rgb;
    }
    disc /= float(FAN_SWEEP_SAMPLES);
    float shimmer = fanRotor(q, sceneryTime*18.);
    float interior = smoothstep(.2,.28,radius)*(1.-smoothstep(.84,.92,radius));
    return mix(painting, disc*(.97+shimmer*.06), interior);
  }
  vec3 fanSurface(vec3 painting, vec2 uv) {
    if (sceneryStyle < .5) return homeFan(painting, uv);
    if (abs(sceneryStyle-7.) < .5) return classroomFan(painting, uv);
    return painting;
  }
`;
