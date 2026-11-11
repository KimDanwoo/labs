/** The slate inside the frame, measured on the 1536 × 1024 classroom painting. */
export const BOARD_RECT = { x: 442, y: 255, width: 655, height: 207 } as const;

/** One resolution for the slate in the scene and on the drawing pad, so a line looks alike in both. */
export const CHALK_LAYER = { width: 1024, height: Math.round((1024 * BOARD_RECT.height) / BOARD_RECT.width) } as const;

export const CHALK_COLOR = { white: '#f4f1e4', yellow: '#f7e17a', pink: '#f5a9bb' } as const;
export type ChalkColor = keyof typeof CHALK_COLOR;

export const CHALK_TOOL = { chalk: 'chalk', eraser: 'eraser' } as const;

/** Points are flat [x0, y0, x1, y1, …] pairs, 0–1 across and down the slate. */
export type ChalkStroke =
  | { tool: typeof CHALK_TOOL.chalk; color: ChalkColor; points: number[] }
  | { tool: typeof CHALK_TOOL.eraser; points: number[] };

export const CHALKBOARD_LIMIT = { strokes: 300, points: 6_000, rawLength: 200_000 } as const;
const CHALKBOARD_VERSION = 1;
const PRECISION = 1_000;
/** About 1.3 board pixels: finer pointer moves add nothing visible but use up the point budget. */
export const MIN_POINT_DISTANCE = 0.002;

const ASPECT = BOARD_RECT.width / BOARD_RECT.height;
const CHALK_WIDTH = 0.022;
const ERASER_WIDTH = 0.09;
const CHALK_ALPHA = 0.86;
const GRAIN_ALPHA = 0.32;

export const roundCoordinate = (value: number) => Math.round(Math.min(1, Math.max(0, value)) * PRECISION) / PRECISION;

export const countPoints = (strokes: readonly ChalkStroke[]) =>
  strokes.reduce((sum, stroke) => sum + stroke.points.length / 2, 0);

/** Whether the pointer has moved far enough from the stroke's last point to keep a new one. */
export function isFarEnough(points: readonly number[], x: number, y: number) {
  if (points.length < 2) return true;
  return Math.hypot(x - points[points.length - 2]!, (y - points[points.length - 1]!) / ASPECT) >= MIN_POINT_DISTANCE;
}

const isCoordinate = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
const isChalkColor = (value: unknown): value is ChalkColor =>
  typeof value === 'string' && Object.hasOwn(CHALK_COLOR, value);

function parseStroke(value: unknown): ChalkStroke | null {
  if (typeof value !== 'object' || value === null) return null;
  const { tool, color, points } = value as Record<string, unknown>;
  if (!Array.isArray(points) || points.length < 2 || points.length % 2 !== 0 || !points.every(isCoordinate))
    return null;
  if (tool === CHALK_TOOL.eraser) return { tool, points };
  if (tool === CHALK_TOOL.chalk && isChalkColor(color)) return { tool, color, points };
  return null;
}

/** Untrusted storage: the whole board is dropped rather than half-replayed if any stroke is malformed. */
export function parseChalkboard(raw: string | null): ChalkStroke[] {
  if (!raw || raw.length > CHALKBOARD_LIMIT.rawLength) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return [];
    const { version, strokes } = parsed as Record<string, unknown>;
    if (version !== CHALKBOARD_VERSION || !Array.isArray(strokes) || strokes.length > CHALKBOARD_LIMIT.strokes)
      return [];
    const valid = strokes.map(parseStroke);
    if (valid.some((stroke) => stroke === null)) return [];
    const board = valid.filter((stroke): stroke is ChalkStroke => stroke !== null);
    return countPoints(board) > CHALKBOARD_LIMIT.points ? [] : board;
  } catch {
    return [];
  }
}

export const serializeChalkboard = (strokes: readonly ChalkStroke[]) =>
  JSON.stringify({ version: CHALKBOARD_VERSION, strokes });

export const canAddStroke = (strokes: readonly ChalkStroke[]) => strokes.length < CHALKBOARD_LIMIT.strokes;
export const canAddPoint = (strokes: readonly ChalkStroke[], draft: readonly number[]) =>
  countPoints(strokes) + draft.length / 2 < CHALKBOARD_LIMIT.points;

function trace(ctx: CanvasRenderingContext2D, points: readonly number[], width: number, height: number, shift = 0) {
  ctx.beginPath();
  ctx.moveTo(points[0]! * width + shift, points[1]! * height - shift);
  // A single tap still leaves a dot.
  if (points.length === 2) ctx.lineTo(points[0]! * width + shift + 0.01, points[1]! * height - shift);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i]! * width + shift, points[i + 1]! * height - shift);
  ctx.stroke();
}

/** Replays strokes in order on a transparent layer, so the eraser reveals the painted slate underneath. */
export function paintChalk(ctx: CanvasRenderingContext2D, strokes: readonly ChalkStroke[]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const stroke of strokes) paintStroke(ctx, stroke);
}

export function paintStroke(ctx: CanvasRenderingContext2D, stroke: ChalkStroke) {
  const { width, height } = ctx.canvas;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (stroke.tool === CHALK_TOOL.eraser) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = ERASER_WIDTH * height;
    trace(ctx, stroke.points, width, height);
    ctx.restore();
    return;
  }
  const lineWidth = CHALK_WIDTH * height;
  ctx.strokeStyle = CHALK_COLOR[stroke.color];
  ctx.globalAlpha = CHALK_ALPHA;
  ctx.lineWidth = lineWidth;
  trace(ctx, stroke.points, width, height);
  // A thinner, fainter offset pass gives the dry, uneven edge of real chalk.
  ctx.globalAlpha = GRAIN_ALPHA;
  ctx.lineWidth = lineWidth * 0.55;
  trace(ctx, stroke.points, width, height, lineWidth * 0.3);
  ctx.restore();
}

/** Chalk joins the painting before any lighting, so dusk, night and lamps fall on it like on the slate itself. */
export const CHALK_GLSL = `
  uniform sampler2D chalk;
  uniform float hasChalk;
  const vec4 BOARD_RECT = vec4(${BOARD_RECT.x}., ${BOARD_RECT.y}., ${BOARD_RECT.width}., ${BOARD_RECT.height}.);
  vec3 chalkSurface(vec3 painting, vec2 uv) {
    if (hasChalk < .5) return painting;
    vec2 board = (vec2(uv.x, 1.-uv.y)*vec2(1536.,1024.) - BOARD_RECT.xy) / BOARD_RECT.zw;
    if (board.x < 0. || board.x > 1. || board.y < 0. || board.y > 1.) return painting;
    // Only the dark green slate takes chalk; the vase and hydrangeas in front keep their paint.
    float slate = smoothstep(.015,.05,painting.g-max(painting.r,painting.b)) * (1.-smoothstep(.38,.45,painting.g));
    vec4 mark = texture2D(chalk, vec2(board.x, 1.-board.y));
    return painting*(1.-mark.a*slate) + mark.rgb*slate;
  }
`;
