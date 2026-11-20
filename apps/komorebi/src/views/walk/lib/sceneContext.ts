import type { TimeOfDay, Weather } from '@views/walk/config/walk';
import type { CompanionReaction } from '@views/walk/lib/companions';
import type { FishingFrame } from '@views/walk/lib/fishing';
import type { createSceneParts } from '@views/walk/lib/sceneSetup';
import type { SceneStatus } from '@views/walk/lib/sceneStatus';
import type { WalkState } from '@views/walk/lib/walkState';
import type { BallGame } from '@views/walk/model/ballGame';
import type { SchoolmateId } from '@views/walk/model/schoolmateRoster';
import type { Appearance } from '@views/walk/model/world/appearance';
import type { Surface } from '@views/walk/model/world/surfaces';
import type { PlaceAction, Point } from '@views/walk/model/world/world';

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
