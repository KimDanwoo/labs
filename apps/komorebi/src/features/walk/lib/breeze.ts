import type { Region } from '@shared/world/world';

export const SCENERY_STYLE = {
  home: 0,
  village: 1,
  river: 2,
  coast: 3,
  forest: 4,
  school: 5,
  shops: 6,
} satisfies Record<Region, number>;

/** Local, feathered movement in painting coordinates; walls, paths and furniture stay rigid. */
export const BREEZE_GLSL = `
  uniform float sceneryStyle;
  uniform float sceneryTime;
  float softPatch(vec2 p, vec2 centre, vec2 radius) {
    return 1. - smoothstep(.55, 1., length((p-centre)/radius));
  }
  float clothPatch(vec2 p, vec4 bounds) {
    vec2 edge = smoothstep(bounds.xy, bounds.xy + vec2(.004), p)
      * (1. - smoothstep(bounds.zw - vec2(.004), bounds.zw, p));
    return edge.x * edge.y * smoothstep(bounds.y, bounds.w, p.y);
  }
  vec2 sceneryUv(vec2 source) {
    vec2 p = vec2(source.x, 1.-source.y);
    vec3 paint = texture2D(map, source).rgb;
    float green = smoothstep(.018, .11, paint.g-max(paint.r*.88,paint.b*1.07));
    float gust = .55 + .30*sin(sceneryTime*.47-p.x*5.) + .15*sin(sceneryTime*.91+p.y*7.);
    float sway = sin(sceneryTime*1.3+p.y*31.+p.x*17.)*gust;
    float depth = mix(.25, 1., smoothstep(.12,.85,p.y));
    // Green pixels select foliage, not roofs, fence rails or the blue water.
    float plants = green;
    if (sceneryStyle < .5) {
      plants *= max(softPatch(p,vec2(.10,.67),vec2(.12,.3)),
        max(softPatch(p,vec2(.80,.23),vec2(.08,.12)),
            softPatch(p,vec2(.58,.46),vec2(.045,.045))));
      float curtains = max(clothPatch(p,vec4(.490,.320,.514,.438)),
                           clothPatch(p,vec4(.603,.320,.626,.438)));
      p.x += curtains * sin(sceneryTime*1.4+p.y*24.) * gust * .0023;
      p.y += curtains * sin(sceneryTime*1.7+p.x*20.) * .0005;
    } else if (sceneryStyle > 5.5) {
      float awnings = max(clothPatch(p,vec4(.091,.341,.328,.379)),
        max(clothPatch(p,vec4(.805,.378,.942,.420)),
            clothPatch(p,vec4(.382,.270,.456,.295))));
      p.y += awnings * sin(sceneryTime*1.8+p.x*25.)*gust*.0018;
      // The green grocer's sign is painted green but isn't a leaf.
      plants *= 1.-softPatch(p,vec2(.405,.233),vec2(.07,.04));
    }
    p.x += plants*sway*.00135*depth;
    p.y += plants*sin(sceneryTime*1.1+p.x*28.)*gust*.00045*depth;
    return vec2(p.x,1.-p.y);
  }
  float sceneryLight(vec2 uv) {
    vec2 p=vec2(uv.x,1.-uv.y);
    float slow=sin(p.x*9.+p.y*4.-sceneryTime*.13)*sin(p.y*7.+sceneryTime*.09);
    float floorMask=smoothstep(.42,.63,p.y);
    float strength=sceneryStyle<.5 ? .022 : .035;
    // Passing clouds and leaf shadows vary gently; no flashes or full-screen white layer.
    return 1.-strength*(.5+.5*slow)*floorMask*(1.-night)*(1.-rain);
  }
`;
