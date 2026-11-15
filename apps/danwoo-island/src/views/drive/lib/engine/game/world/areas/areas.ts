import type * as THREE from 'three/webgpu';

import { getGame } from '../../gameContext';
import { applyIslandTextures } from '../islandTextures';
import { AchievementsArea } from './achievementsArea';
import { AltarArea } from './altarArea';
import { BehindTheSceneArea } from './behindTheSceneArea';
import { BowlingArea } from './bowlingArea';
import { CareerArea } from './careerArea';
import { CircuitArea } from './circuitArea';
import { CookieArea } from './cookieArea';
import { LabArea } from './labArea';
import { LandingArea } from './landingArea';
import { ProjectsArea } from './projectsArea';
import { SocialArea } from './socialArea';
import { TimeMachineArea } from './timeMachineArea';
import { ToiletArea } from './toiletArea';

export interface Areas {
  achievements?: AchievementsArea;
  altar?: AltarArea;
  behindTheScene?: BehindTheSceneArea;
  bowling?: BowlingArea;
  career?: CareerArea;
  circuit?: CircuitArea;
  cookie?: CookieArea;
  lab?: LabArea;
  landing?: LandingArea;
  projects?: ProjectsArea;
  social?: SocialArea;
  toilet?: ToiletArea;
  timeMachine?: TimeMachineArea;
}

type AreaName = keyof Areas;
type AreaBuilder = (areas: Areas, model: THREE.Object3D) => void;

const AREA_BUILDERS = {
  achievements: (areas, model) => {
    areas.achievements = new AchievementsArea(model);
  },
  altar: (areas, model) => {
    areas.altar = new AltarArea(model);
  },
  behindTheScene: (areas, model) => {
    areas.behindTheScene = new BehindTheSceneArea(model);
  },
  bowling: (areas, model) => {
    areas.bowling = new BowlingArea(model);
  },
  career: (areas, model) => {
    areas.career = new CareerArea(model);
  },
  circuit: (areas, model) => {
    areas.circuit = new CircuitArea(model);
  },
  cookie: (areas, model) => {
    areas.cookie = new CookieArea(model);
  },
  lab: (areas, model) => {
    areas.lab = new LabArea(model);
  },
  landing: (areas, model) => {
    areas.landing = new LandingArea(model);
  },
  projects: (areas, model) => {
    areas.projects = new ProjectsArea(model);
  },
  social: (areas, model) => {
    areas.social = new SocialArea(model);
  },
  toilet: (areas, model) => {
    areas.toilet = new ToiletArea(model);
  },
  timeMachine: (areas, model) => {
    areas.timeMachine = new TimeMachineArea(model);
  },
} satisfies Record<AreaName, AreaBuilder>;

const AREA_ENTRIES = Object.entries(AREA_BUILDERS);

export function createAreas(): Areas {
  const game = getGame();
  const { scene } = game.model('areasModel');
  applyIslandTextures(scene, game.resources);

  const areas: Areas = {};
  for (const child of [...scene.children]) {
    for (const [name, build] of AREA_ENTRIES) {
      if (child.name.startsWith(name)) build(areas, child);
    }
  }
  return areas;
}
