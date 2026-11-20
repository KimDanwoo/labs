import { TIME, WEATHER, type TimeOfDay, type Weather } from '@views/walk/config/walk';
import type { FishingFrame } from '@views/walk/lib/fishing';
import type { SceneStatus } from '@views/walk/lib/sceneStatus';
import type { BallGame } from '@views/walk/model/ballGame';
import type { SchoolmateId } from '@views/walk/model/schoolmateRoster';
import type { Appearance } from '@views/walk/model/world/appearance';
import type { WorldPortal } from '@views/walk/model/world/portals';
import { REGION, SPAWN, type Point, type Region } from '@views/walk/model/world/world';

export interface WalkState {
  currentAppearance: Appearance;
  appearanceRequest: number;
  fishingFrame: FishingFrame | null;
  fishingAge: number;
  fishingLift: number;
  companionAge: number;
  greetingId: SchoolmateId | null;
  ballFrame: BallGame | null;
  sceneryTime: number;
  region: Region;
  position: Point;
  route: Point[];
  destination: string | null;
  elapsed: number;
  last: number;
  nextFrame: number;
  statusTime: number;
  distance: number;
  animation: number;
  disposed: boolean;
  timeOfDay: TimeOfDay;
  darkness: number;
  weather: Weather;
  wetness: number;
  paused: boolean;
  sleeping: boolean;
  preparingSleep: boolean;
  sleepBlocked: boolean;
  isSettling: boolean;
  warmth: number;
  transition: number;
  blockedPortal: WorldPortal | null;
  waitingPortal: WorldPortal | null;
  actionEndsAt: number;
  cancelledPortal: WorldPortal | null;
  heading: number;
  moveSpeed: number;
  touchSprint: boolean;
  reducedMotion: boolean;
  halfWidth: number;
  halfHeight: number;
  previousStatus: SceneStatus | undefined;
}

export const START_REGION: Region = REGION.village;

export function createWalkState(appearance: Appearance, reducedMotion: boolean): WalkState {
  return {
    currentAppearance: appearance,
    appearanceRequest: 0,
    fishingFrame: null,
    fishingAge: 0,
    fishingLift: 0,
    companionAge: 10,
    greetingId: null,
    ballFrame: null,
    sceneryTime: 0,
    region: START_REGION,
    position: { ...SPAWN },
    route: [],
    destination: null,
    elapsed: 0,
    last: 0,
    nextFrame: 0,
    statusTime: -1,
    distance: 0,
    animation: 0,
    disposed: false,
    timeOfDay: TIME.day,
    darkness: 0,
    weather: WEATHER.clear,
    wetness: 0,
    paused: false,
    sleeping: false,
    preparingSleep: false,
    sleepBlocked: false,
    isSettling: true,
    warmth: 0,
    transition: 1,
    blockedPortal: null,
    waitingPortal: null,
    actionEndsAt: 0,
    cancelledPortal: null,
    heading: 0,
    moveSpeed: 0,
    touchSprint: false,
    reducedMotion,
    halfWidth: 60,
    halfHeight: 40,
    previousStatus: undefined,
  };
}
