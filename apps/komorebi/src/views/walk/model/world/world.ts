export const REGION = {
  village: 'village',
  river: 'river',
  coast: 'coast',
  forest: 'forest',
  school: 'school',
  shops: 'shops',
  home: 'home',
  hallway: 'hallway',
  classroom: 'classroom',
} as const;
export type Region = (typeof REGION)[keyof typeof REGION];
const INDOOR_REGIONS: readonly Region[] = [REGION.home, REGION.hallway, REGION.classroom];
export const isIndoors = (region: Region) => INDOOR_REGIONS.includes(region);
export type Point = { x: number; z: number };
export type RouteNode = Point & { id: string };
export type Route = { a: string; b: string; width: number };
export const SPAWN: Point = { x: 50, z: 82 };
export const HOME = {
  id: 'home',
  region: 'home',
  name: '파란 지붕 우리 집',
  short: '우리 집',
  icon: '⌂',
  x: 36,
  z: 70,
} as const;
export const HOME_DOOR = { x: 15, z: 38 };
export const HOME_DESK = { name: '작은 그림일기 책상', x: 40, z: 57 };
export const HOME_WARDROBE = { name: '나무 옷장', x: 86, z: 62 };
export const HOME_BED = { name: '포근한 잠자리', x: 70, z: 76 };
export const CLASSROOM_BOARD = { name: '초록 칠판', x: 50, z: 62 };
export const PLACE_ACTION = {
  gust: 'gust',
  skip: 'skip',
  shell: 'shell',
  bell: 'bell',
  schoolBell: 'schoolBell',
  windChime: 'windChime',
  book: 'book',
} as const;
export type PlaceAction = (typeof PLACE_ACTION)[keyof typeof PLACE_ACTION];
