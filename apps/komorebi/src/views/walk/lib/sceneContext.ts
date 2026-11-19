import type { TimeOfDay, Weather } from '../config/walk';
import type { BallGame } from '../model/ballGame';
import type { SchoolmateId } from '../model/schoolmateRoster';
import type { Appearance } from '../model/world/appearance';
import type { Surface } from '../model/world/surfaces';
import type { PlaceAction, Point } from '../model/world/world';
import type { CompanionReaction } from './companions';
import type { FishingFrame } from './fishing';
import type { createSceneParts } from './sceneSetup';
import type { SceneStatus } from './sceneStatus';
import type { WalkState } from './walkState';

export type SceneOptions = {
  onStatus: (status: SceneStatus) => void;
  onNotice: (message: string) => void;
  onStep: (surface: Surface, loudness: number) => void;
  onSleep: () => void;
  appearance?: Appearance;
  signal?: AbortSignal;
};
export type WalkEngine = {
  dispose: () => void;
  setPaused: (value: boolean) => void;
  finishSleep: () => void;
  setFishing: (frame: FishingFrame | null) => void;
  greetSchoolmate: (id: SchoolmateId) => boolean;
  endSchoolmateGreeting: () => void;
  setBallGame: (frame: BallGame | null) => boolean;
  reactToCompanion: (reaction: CompanionReaction) => void;
  setAppearance: (appearance: Appearance) => Promise<boolean>;
  setTimeOfDay: (value: TimeOfDay) => void;
  setWeather: (value: Weather) => void;
  setInput: (key: string, pressed: boolean) => void;
  reset: () => void;
  photo: () => Promise<boolean>;
  travelTo: (id: string) => void;
  playAction: (kind: PlaceAction, at: Point) => boolean;
};

export type SceneParts = Awaited<ReturnType<typeof createSceneParts>>;

export interface SceneContext {
  container: HTMLElement;
  options: SceneOptions;
  state: WalkState;
  parts: SceneParts;
  wake: () => void;
}
