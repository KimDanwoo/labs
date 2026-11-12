export const ROOM_CAPACITY = 4;
export const MAX_MESSAGE_LENGTH = 2_048;
export const NICKNAME_MAX_LENGTH = 12;
export const ROOM_ID_PATTERN = /^[a-f0-9]{32}$/;
export const MESSAGE = { hello: 'hello', move: 'move', welcome: 'welcome', peers: 'peers', error: 'error' } as const;
export const ROOM_ERROR = { full: 'full', invalid: 'invalid', rate: 'rate' } as const;
export const REGIONS = [
  'village',
  'river',
  'coast',
  'forest',
  'school',
  'shops',
  'home',
  'hallway',
  'classroom',
] as const;
const OUTFITS = ['summer', 'overalls', 'pe'] as const;
const TIMES = ['day', 'evening', 'night'] as const;
const WEATHER = ['clear', 'rain'] as const;
export type Climate = { time: (typeof TIMES)[number]; weather: (typeof WEATHER)[number] };
export type Walker = {
  region: (typeof REGIONS)[number];
  x: number;
  z: number;
  heading: number;
  isWalking: boolean;
  isRunning: boolean;
  jumpHeight: number;
  outfit: (typeof OUTFITS)[number];
};
export type Peer = { id: string; nickname: string; walker: Walker };
export type ClientMessage =
  | { type: typeof MESSAGE.hello; nickname: string; walker: Walker; climate: Climate }
  | { type: typeof MESSAGE.move; walker: Walker };
export type ServerMessage =
  | { type: typeof MESSAGE.welcome; id: string; peers: Peer[]; climate: Climate }
  | { type: typeof MESSAGE.peers; peers: Peer[] }
  | { type: typeof MESSAGE.error; reason: (typeof ROOM_ERROR)[keyof typeof ROOM_ERROR] };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function member<T extends string>(value: unknown, list: readonly T[]): value is T {
  return list.some((entry) => entry === value);
}
function inRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}
export function nicknameIsValid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim() === value &&
    value.length > 0 &&
    Array.from(value).length <= NICKNAME_MAX_LENGTH &&
    !/[\p{Cc}\p{Cf}]/u.test(value)
  );
}
export function walkerIsValid(value: unknown): value is Walker {
  return (
    record(value) &&
    member(value.region, REGIONS) &&
    member(value.outfit, OUTFITS) &&
    inRange(value.x, 0, 100) &&
    inRange(value.z, 0, 100) &&
    inRange(value.heading, -Math.PI, Math.PI) &&
    inRange(value.jumpHeight, 0, 10) &&
    typeof value.isWalking === 'boolean' &&
    typeof value.isRunning === 'boolean'
  );
}
function climateIsValid(value: unknown): value is Climate {
  return record(value) && member(value.time, TIMES) && member(value.weather, WEATHER);
}
function peerIsValid(value: unknown): value is Peer {
  return (
    record(value) &&
    typeof value.id === 'string' &&
    /^[a-f0-9-]{36}$/.test(value.id) &&
    nicknameIsValid(value.nickname) &&
    walkerIsValid(value.walker)
  );
}
function peersAreValid(value: unknown): value is Peer[] {
  return (
    Array.isArray(value) &&
    value.length <= ROOM_CAPACITY &&
    value.every(peerIsValid) &&
    new Set(value.map((peer) => peer.id)).size === value.length
  );
}
function decode(raw: unknown): unknown {
  if (typeof raw !== 'string' || raw.length > MAX_MESSAGE_LENGTH) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
export function parseClientMessage(raw: unknown): ClientMessage | null {
  const value = decode(raw);
  if (!record(value) || !walkerIsValid(value.walker)) return null;
  const { region, x, z, heading, isWalking, isRunning, jumpHeight, outfit } = value.walker;
  const walker = { region, x, z, heading, isWalking, isRunning, jumpHeight, outfit };
  if (value.type === MESSAGE.move) return { type: MESSAGE.move, walker };
  if (value.type === MESSAGE.hello && nicknameIsValid(value.nickname) && climateIsValid(value.climate))
    return {
      type: MESSAGE.hello,
      nickname: value.nickname,
      walker,
      climate: { time: value.climate.time, weather: value.climate.weather },
    };
  return null;
}
export function parseServerMessage(raw: unknown): ServerMessage | null {
  const value = decode(raw);
  if (!record(value)) return null;
  if (value.type === MESSAGE.error && member(value.reason, Object.values(ROOM_ERROR)))
    return { type: MESSAGE.error, reason: value.reason };
  if (!peersAreValid(value.peers)) return null;
  if (value.type === MESSAGE.peers) return { type: MESSAGE.peers, peers: value.peers };
  if (
    value.type === MESSAGE.welcome &&
    typeof value.id === 'string' &&
    value.peers.some((peer) => peer.id === value.id) &&
    climateIsValid(value.climate)
  )
    return { type: MESSAGE.welcome, id: value.id, peers: value.peers, climate: value.climate };
  return null;
}
