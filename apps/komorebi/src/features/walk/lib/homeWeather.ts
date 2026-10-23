/** Rain belongs beyond the door and window panes; the room stays dry and sheltered. */
export const HOME_WEATHER_GLSL = `
  uniform float outdoorRain;
  float windowPane(vec2 p, vec4 box) {
    vec2 inside=smoothstep(box.xy,box.xy+vec2(.003),p)
      *(1.-smoothstep(box.zw-vec2(.003),box.zw,p));
    return inside.x*inside.y;
  }
  vec3 homeWeather(vec3 colour, vec2 uv) {
    if(isHome<.5 || outdoorRain<.001) return colour;
    vec2 p=vec2(uv.x,1.-uv.y);
    float outside=max(windowPane(p,vec4(.114,.305,.231,.595)),
      max(windowPane(p,vec4(.516,.343,.552,.413)),windowPane(p,vec4(.564,.343,.597,.413))));
    vec3 cloudy=mix(colour,vec3(dot(colour,vec3(.3,.59,.11))),.4)*vec3(.52,.64,.73);
    colour=mix(colour,cloudy,outside*outdoorRain*.8);
    vec2 cell=vec2(p.x*180.+p.y*32.,p.y*34.+sceneryTime*9.);
    float seed=fract(sin(floor(cell.x)*127.1)*43758.5453);
    float streak=(1.-smoothstep(.025,.12,abs(fract(cell.x)-.5)))
      *(1.-smoothstep(.12,.29,abs(fract(cell.y+seed)-.5)))*step(.42,seed);
    colour+=vec3(.16,.21,.24)*streak*outside*outdoorRain*(1.-night*.75);
    return colour;
  }
`;
