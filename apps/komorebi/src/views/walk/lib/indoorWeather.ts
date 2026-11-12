import type { Region } from '../model/world/world';
import { SCENERY_STYLE } from './breeze';

type Pixel = readonly [number, number];
type Pane = readonly [Pixel, Pixel, Pixel, Pixel];
const rect = ([left, top, right, bottom]: readonly [number, number, number, number]): Pane => [
  [left, top],
  [right, top],
  [right, bottom],
  [left, bottom],
];

export const WINDOW_RAIN_VELOCITY = { x: -0.045, y: 0.25 } as const;
export const INDOOR_RAIN_ROOMS = [
  { region: 'home', panes: [rect([175, 312, 355, 609]), rect([793, 351, 848, 423]), rect([866, 351, 917, 423])] },
  {
    region: 'classroom',
    panes: [
      [
        [52, 139],
        [109, 168],
        [109, 239],
        [52, 220],
      ],
      [
        [52, 243],
        [109, 261],
        [109, 395],
        [52, 399],
      ],
      [
        [129, 172],
        [207, 206],
        [207, 268],
        [129, 246],
      ],
      [
        [129, 268],
        [207, 291],
        [207, 447],
        [129, 465],
      ],
      [
        [231, 214],
        [282, 235],
        [282, 284],
        [231, 271],
      ],
      [
        [232, 294],
        [282, 306],
        [282, 422],
        [232, 441],
      ],
      [
        [301, 244],
        [325, 254],
        [325, 296],
        [301, 290],
      ],
      [
        [301, 314],
        [325, 319],
        [325, 466],
        [301, 476],
      ],
      rect([1448, 288, 1467, 322]),
      rect([1448, 337, 1467, 363]),
      rect([1448, 378, 1467, 403]),
      rect([1448, 419, 1467, 460]),
    ],
  },
  {
    region: 'hallway',
    panes: [
      rect([49, 281, 122, 326]),
      rect([134, 281, 201, 326]),
      rect([216, 281, 281, 326]),
      rect([294, 281, 363, 326]),
      rect([184, 355, 332, 606]),
      [
        [130, 365],
        [147, 374],
        [147, 591],
        [130, 609],
      ],
      [
        [347, 372],
        [361, 361],
        [361, 616],
        [347, 600],
      ],
      rect([1416, 262, 1438, 280]),
      rect([1449, 262, 1469, 280]),
      rect([1416, 291, 1438, 312]),
      rect([1449, 291, 1469, 312]),
    ],
  },
] as const satisfies readonly { region: Region; panes: readonly Pane[] }[];

const glPoint = ([x, y]: Pixel): string => `vec2(${(x / 1536).toFixed(6)},${(y / 1024).toFixed(6)})`;
const paneExpression = (pane: Pane): string => `rainPane(p,${pane.map(glPoint).join(',')})`;
const roomMasks = INDOOR_RAIN_ROOMS.map(({ region, panes }) => {
  const mask = panes.map(paneExpression).reduce((mask, pane) => `max(${mask},${pane})`, '0.');
  return `if(abs(sceneryStyle-${SCENERY_STYLE[region]}.0)<.5) return ${mask};`;
}).join('\n');

/** Window coordinates run downward, so subtracting their positive velocity makes streaks fall. */
export const INDOOR_WEATHER_GLSL = `
  uniform float outdoorRain;
  float rainPaneEdge(vec2 p, vec2 a, vec2 b) {
    vec2 d=b-a;
    return (d.x*(p.y-a.y)-d.y*(p.x-a.x))/max(length(d),.00001);
  }
  float rainPane(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
    return smoothstep(0.,.0025,rainPaneEdge(p,a,b))
      *smoothstep(0.,.0025,rainPaneEdge(p,b,c))
      *smoothstep(0.,.0025,rainPaneEdge(p,c,d))
      *smoothstep(0.,.0025,rainPaneEdge(p,d,a));
  }
  float indoorRainMask(vec2 p) {
    ${roomMasks}
    return 0.;
  }
  vec3 indoorWeather(vec3 colour, vec2 uv) {
    if(outdoorRain<.001) return colour;
    vec2 p=vec2(uv.x,1.-uv.y);
    float outside=indoorRainMask(p);
    if(outside<.001) return colour;
    vec3 cloudy=mix(colour,vec3(dot(colour,vec3(.3,.59,.11))),.4)*vec3(.52,.64,.73);
    colour=mix(colour,cloudy,outside*outdoorRain*.8);
    vec2 falling=p-vec2(${WINDOW_RAIN_VELOCITY.x},${WINDOW_RAIN_VELOCITY.y})*sceneryTime;
    vec2 cell=vec2(falling.x*180.+falling.y*32.,falling.y*34.);
    float seed=fract(sin(floor(cell.x)*127.1)*43758.5453);
    float streak=(1.-smoothstep(.025,.12,abs(fract(cell.x)-.5)))
      *(1.-smoothstep(.12,.29,abs(fract(cell.y+seed)-.5)))*step(.42,seed);
    colour+=vec3(.16,.21,.24)*streak*outside*outdoorRain*(1.-night*.75);
    return colour;
  }
`;
